"""
Warbot ADB Execute Endpoint Example
Add this to your warbot backend to support ADB navigation commands
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Literal
import asyncio

# Import your existing ADB utilities
from adb_utils import tap, swipe, press_key, input_text, KEY_CODES

router = APIRouter()

class ADBCommand(BaseModel):
    type: Literal['tap', 'swipe', 'key', 'text', 'wait', 'sequence']
    x: Optional[int] = None
    y: Optional[int] = None
    x1: Optional[int] = None
    y1: Optional[int] = None
    x2: Optional[int] = None
    y2: Optional[int] = None
    duration: Optional[int] = None
    keycode: Optional[int] = None
    text: Optional[str] = None
    commands: Optional[List['ADBCommand']] = None
    delay: Optional[int] = None
    description: Optional[str] = None

class ExecuteRequest(BaseModel):
    device_id: str = "127.0.0.1:5555"
    command: Optional[ADBCommand] = None
    sequence: Optional[List[ADBCommand]] = None

@router.post("/api/adb/execute")
async def execute_adb_command(request: ExecuteRequest):
    """
    Execute a single ADB command or sequence of commands
    """
    device_id = request.device_id
    
    try:
        if request.sequence:
            # Execute sequence
            results = []
            for cmd in request.sequence:
                result = await execute_single_command(device_id, cmd)
                results.append(result)
                
                # Add delay if specified
                if cmd.delay and cmd.delay > 0:
                    await asyncio.sleep(cmd.delay / 1000.0)
            
            return {
                "success": True,
                "results": results,
                "executed": len(results)
            }
        elif request.command:
            # Execute single command
            result = await execute_single_command(device_id, request.command)
            return {
                "success": result["success"],
                "result": result.get("result"),
                "error": result.get("error")
            }
        else:
            raise HTTPException(status_code=400, detail="No command or sequence provided")
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

async def execute_single_command(device_id: str, command: ADBCommand) -> dict:
    """
    Execute a single ADB command
    """
    try:
        if command.type == "tap":
            if command.x is None or command.y is None:
                return {"success": False, "error": "Tap requires x and y coordinates"}
            result = tap(command.x, command.y, device_id)
            return {
                "success": result.returncode == 0,
                "result": result.stdout,
                "error": result.stderr if result.returncode != 0 else None
            }
        
        elif command.type == "swipe":
            if any(v is None for v in [command.x1, command.y1, command.x2, command.y2]):
                return {"success": False, "error": "Swipe requires x1, y1, x2, y2 coordinates"}
            result = swipe(
                command.x1, command.y1,
                command.x2, command.y2,
                command.duration or 300,
                device_id
            )
            return {
                "success": result.returncode == 0,
                "result": result.stdout,
                "error": result.stderr if result.returncode != 0 else None
            }
        
        elif command.type == "key":
            if command.keycode is None:
                return {"success": False, "error": "Key command requires keycode"}
            result = press_key(command.keycode, device_id)
            return {
                "success": result.returncode == 0,
                "result": result.stdout,
                "error": result.stderr if result.returncode != 0 else None
            }
        
        elif command.type == "text":
            if command.text is None:
                return {"success": False, "error": "Text command requires text"}
            result = input_text(command.text, device_id)
            return {
                "success": result.returncode == 0,
                "result": result.stdout,
                "error": result.stderr if result.returncode != 0 else None
            }
        
        elif command.type == "wait":
            duration_ms = command.duration or 1000
            await asyncio.sleep(duration_ms / 1000.0)
            return {
                "success": True,
                "result": f"Waited {duration_ms}ms"
            }
        
        elif command.type == "sequence":
            if command.commands is None:
                return {"success": False, "error": "Sequence requires commands array"}
            results = []
            for cmd in command.commands:
                result = await execute_single_command(device_id, cmd)
                results.append(result)
                if cmd.delay and cmd.delay > 0:
                    await asyncio.sleep(cmd.delay / 1000.0)
            return {
                "success": all(r["success"] for r in results),
                "result": results
            }
        
        else:
            return {"success": False, "error": f"Unknown command type: {command.type}"}
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Add to your main FastAPI app:
# from warbot_adb_endpoint_example import router
# app.include_router(router)

