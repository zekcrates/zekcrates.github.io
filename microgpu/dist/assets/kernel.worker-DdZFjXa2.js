(function(){let e=self,t=null;async function n(){return t||=(async()=>{let{loadPyodide:e}=await import(`https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.mjs`),t=await e({indexURL:`https://cdn.jsdelivr.net/pyodide/v0.26.4/full/`});return t.runPython(r),t})(),t}let r=`
import math
import traceback

def run_kernel(code, data, blockDim):
    blocks = max(1, math.ceil(len(data) / blockDim)) if data else 1
    threads_ran = 0
    try:
        user_code = compile(code, "kernel.py", "exec")
    except SyntaxError as e:
        return {"status": "error", "phase": "compile", "error": f"SyntaxError: {e.msg} (line {e.lineno})"}
    except Exception as e:
        return {"status": "error", "phase": "compile", "error": f"{type(e).__name__}: {e}"}

    # Compile the module once, like LeetCode's class boilerplate
    mod = {"__name__": "kernel_module", "data": data}
    try:
        exec(user_code, mod)
    except Exception as e:
        return {"status": "error", "phase": "run", "error": f"{type(e).__name__}: {e}"}

    fn = mod.get("kernel")
    for blockIdx in range(blocks):
        for threadIdx in range(blockDim):
            env = {
                "blockIdx": blockIdx,
                "blockDim": blockDim,
                "threadIdx": threadIdx,
                "data": data,
            }
            try:
                if fn is not None:
                    fn(blockIdx, blockDim, threadIdx, data)
                else:
                    exec(user_code, env)
            except Exception as e:
                tb = e.__traceback__
                line = None
                while tb is not None:
                    if tb.tb_frame.f_code.co_filename == "kernel.py":
                        line = tb.tb_lineno
                    tb = tb.tb_next
                where = f" at line {line}" if line else ""
                return {
                    "status": "error",
                    "phase": "run",
                    "error": f"{type(e).__name__}: {e}{where}",
                    "thread": {"blockIdx": blockIdx, "threadIdx": threadIdx},
                }
            threads_ran += 1
    return {"status": "ok", "memory": data, "threads": threads_ran, "blocks": blocks}
`;e.onmessage=async t=>{let{type:r,id:i,code:a,data:o,blockDim:s,testCode:c}=t.data;if(r===`run`)try{let t=await n();if(c){t.globals.set(`__code`,a),t.globals.set(`__test`,c);let n=await t.runPythonAsync(`
import json, io, sys

__user_out = io.StringIO()
__test_out = io.StringIO()

sys.stdout = __user_out
exec(compile(__code, "user.py", "exec"))

sys.stdout = __test_out
exec(compile(__test, "test.py", "exec"))
sys.stdout = sys.__stdout__

full_output = __user_out.getvalue() + __test_out.getvalue()
json.dumps({"status": "ok", "passed": "PASS" in full_output})
`);e.postMessage({type:`result`,id:i,result:JSON.parse(n)})}else{t.globals.set(`__code`,a),t.globals.set(`__data`,t.toPy(o)),t.globals.set(`__blockDim`,s);let n=await t.runPythonAsync(`import json
json.dumps(run_kernel(__code, __data, __blockDim))`);e.postMessage({type:`result`,id:i,result:JSON.parse(n)})}}catch(t){e.postMessage({type:`result`,id:i,result:{status:`error`,phase:`setup`,error:String(t)}})}}})();