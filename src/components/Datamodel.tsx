import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select"

const Datamodel = () => {
    const [dop, setDop] = useState("")
    const [sensorId, setSensorId] = useState("")
    const [acqMode, setAcqMode] = useState("")
    const [node, setNode] = useState("")

    const handleFetch = () => {
        console.log({
            dop,
            sensorId,
            acqMode,
            node,
        })
    }

    return (
        <div className="p-8">
            <div className="mx-auto">
                <h1 className="text-2xl font-bold mb-8">Data Model</h1>

                <div className="flex items-end gap-4 mb-8">
                    {/* DOP Input */}
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="dop" className="text-sm font-medium">
                            DOP
                        </label>
                        <Input
                            id="dop"
                            type="text"
                            placeholder="Enter DOP"
                            value={dop}
                            onChange={(e) => setDop(e.target.value)}
                        />
                    </div>

                    {/* Sensor ID Select */}
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="sensorid" className="text-sm font-medium">
                            Sensor ID
                        </label>
                        <Select value={sensorId} onValueChange={setSensorId}>
                            <SelectTrigger id="sensorid">
                                <SelectValue placeholder="Select Sensor ID" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OCM">OCM</SelectItem>
                                <SelectItem value="SSTM">SSTM</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Acquisition Mode Select */}
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="acq_mode" className="text-sm font-medium">
                            Acquisition Mode
                        </label>
                        <Select value={acqMode} onValueChange={setAcqMode}>
                            <SelectTrigger id="acq_mode">
                                <SelectValue placeholder="Select Mode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LAC">LAC</SelectItem>
                                <SelectItem value="GAC">GAC</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Node Select */}
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="node" className="text-sm font-medium">
                            Node
                        </label>
                        <Select value={node} onValueChange={setNode}>
                            <SelectTrigger id="node">
                                <SelectValue placeholder="Select Node" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NS">NS</SelectItem>
                                <SelectItem value="SN">SN</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fetch Button */}
                    <Button onClick={handleFetch} className="px-6">
                        Fetch
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Datamodel