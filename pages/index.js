import Editor from '@monaco-editor/react'
import Script from 'next/script'
import React, { useRef } from 'react'

// override default console.log to capture print() calls
let writeToTerminal = null
const log = console.log
console.log = (...args) => {
  if (writeToTerminal) writeToTerminal(...args)
  log(...args)
}

export default function Home() {
  const pyodideRef = useRef(null)

  return (
    <div>
      <Script
        defer
        src="https://cdn.jsdelivr.net/pyodide/v0.20.0/full/pyodide.js"
        onLoad={() => {
          async function load() {
            // init xterm
            const { Terminal } = await import('xterm')
            const terminal = new Terminal()
            terminal.open(document.getElementById('terminal'), false)

            // init pyodide
            const pyodide = await loadPyodide()
            pyodideRef.current = pyodide

            // Pyodide is now ready to use...
            pyodide.runPython(`
                  import sys
                  sys.version
                `)

            // attach function
            writeToTerminal = (...args) => terminal.writeln(args.join(' '))
          }
          load()
        }}
      ></Script>

      <Editor
        height="50vh"
        defaultLanguage="python"
        defaultValue={FIZZ_BUZZ}
        onMount={(editor, monaco) => {
          editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            () => {
              const pyodide = pyodideRef.current

              if (!pyodide) return

              // get & run the code
              const code = editor.getValue()
              const output = pyodide.runPython(code)
              if (output) writeToTerminal(output.toString())
            }
          )
        }}
      />

      <div id="terminal" />
    </div>
  )
}

const FIZZ_BUZZ = `\
def fizzbuzz(n):
    for i in range(1, n+1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)

fizzbuzz(15)
`
