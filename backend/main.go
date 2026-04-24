package main

import (
	"bufio"
	"crypto/sha1"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultFilePath = "./data.bin"
	websocketGUID   = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
	chunkSize       = 32 * 1024
)

func main() {
	filePath := envOrDefault("STREAM_FILE_PATH", defaultFilePath)
	port := envOrDefault("PORT", "8080")
	pollMS := envOrDefault("STREAM_POLL_MS", "100")

	pollInterval, err := strconv.Atoi(pollMS)
	if err != nil || pollInterval <= 0 {
		pollInterval = 100
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = fmt.Fprintf(w, `{"status":"ok","file":"%s"}`+"\n", filePath)
	})
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		if err := handleWS(w, r, filePath, time.Duration(pollInterval)*time.Millisecond); err != nil {
			log.Printf("websocket error: %v", err)
		}
	})

	address := ":" + port
	log.Printf("streaming %s on ws://localhost%s/ws", filePath, address)
	if err := http.ListenAndServe(address, mux); err != nil {
		log.Fatal(err)
	}
}

func handleWS(w http.ResponseWriter, r *http.Request, filePath string, pollInterval time.Duration) error {
	if !strings.EqualFold(r.Header.Get("Upgrade"), "websocket") {
		http.Error(w, "upgrade required", http.StatusUpgradeRequired)
		return errors.New("missing websocket upgrade header")
	}

	conn, brw, err := hijackConnection(w)
	if err != nil {
		return err
	}
	defer conn.Close()

	acceptKey, err := computeAcceptKey(r.Header.Get("Sec-WebSocket-Key"))
	if err != nil {
		return err
	}

	response := strings.Join([]string{
		"HTTP/1.1 101 Switching Protocols",
		"Upgrade: websocket",
		"Connection: Upgrade",
		"Sec-WebSocket-Accept: " + acceptKey,
		"",
		"",
	}, "\r\n")

	if _, err := brw.WriteString(response); err != nil {
		return fmt.Errorf("write handshake: %w", err)
	}
	if err := brw.Flush(); err != nil {
		return fmt.Errorf("flush handshake: %w", err)
	}

	return streamBinaryTail(conn, filePath, pollInterval)
}

func streamBinaryTail(conn net.Conn, filePath string, pollInterval time.Duration) error {
	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("open file: %w", err)
	}
	defer file.Close()

	buffer := make([]byte, chunkSize)
	var offset int64

	for {
		stat, err := file.Stat()
		if err != nil {
			return fmt.Errorf("stat file: %w", err)
		}

		if stat.Size() < offset {
			offset = 0
		}

		if stat.Size() == offset {
			time.Sleep(pollInterval)
			continue
		}

		for offset < stat.Size() {
			remaining := stat.Size() - offset
			readLength := int64(len(buffer))
			if remaining < readLength {
				readLength = remaining
			}

			n, readErr := file.ReadAt(buffer[:readLength], offset)
			if n > 0 {
				payload := make([]byte, n)
				copy(payload, buffer[:n])
				if err := writeBinaryFrame(conn, payload); err != nil {
					return fmt.Errorf("write websocket frame: %w", err)
				}
				offset += int64(n)
			}

			if readErr != nil {
				if errors.Is(readErr, io.EOF) {
					break
				}
				return fmt.Errorf("read file: %w", readErr)
			}
		}
	}
}

func writeBinaryFrame(conn net.Conn, payload []byte) error {
	header := make([]byte, 0, 10)
	header = append(header, 0x82)

	payloadLen := len(payload)
	switch {
	case payloadLen <= 125:
		header = append(header, byte(payloadLen))
	case payloadLen <= 65535:
		header = append(header, 126, byte(payloadLen>>8), byte(payloadLen))
	default:
		header = append(header,
			127,
			byte(uint64(payloadLen)>>56),
			byte(uint64(payloadLen)>>48),
			byte(uint64(payloadLen)>>40),
			byte(uint64(payloadLen)>>32),
			byte(uint64(payloadLen)>>24),
			byte(uint64(payloadLen)>>16),
			byte(uint64(payloadLen)>>8),
			byte(uint64(payloadLen)),
		)
	}

	if _, err := conn.Write(header); err != nil {
		return err
	}
	_, err := conn.Write(payload)
	return err
}

func hijackConnection(w http.ResponseWriter) (net.Conn, *bufio.ReadWriter, error) {
	hijacker, ok := w.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("response writer does not support hijacking")
	}
	conn, brw, err := hijacker.Hijack()
	if err != nil {
		return nil, nil, fmt.Errorf("hijack connection: %w", err)
	}
	return conn, brw, nil
}

func computeAcceptKey(key string) (string, error) {
	if key == "" {
		return "", errors.New("missing Sec-WebSocket-Key")
	}
	hash := sha1.Sum([]byte(key + websocketGUID))
	return base64.StdEncoding.EncodeToString(hash[:]), nil
}

func envOrDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
