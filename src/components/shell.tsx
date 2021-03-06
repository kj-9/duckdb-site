import './shell.css';
import 'xterm/css/xterm.css';

import * as duckdb from '@duckdb/duckdb-wasm';
import FontFaceObserver from 'fontfaceobserver';
import React, { useEffect, useState } from 'react';
import { ITerminalOptions, Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { WebglAddon } from 'xterm-addon-webgl';

import { startConnection } from '../duckdb';
import { SpecialKeys } from '../keys';

const hasWebGL = (): boolean => {
  if (duckdb.isSafari()) {
    return false;
  }
  const canvas = document.createElement('canvas') as any;
  const supports =
    'probablySupportsContext' in canvas ? 'probablySupportsContext' : 'supportsContext';
  if (supports in canvas) {
    return canvas[supports]('webgl2');
  }
  return 'WebGL2RenderingContext' in window;
};

export const Shell: React.FC = () => {
  const SHELL_FONT_FAMILY = 'Roboto Mono';
  const options: ITerminalOptions = {
    rows: 100,
    cursorBlink: true,
    cursorWidth: 10,
    fontFamily: SHELL_FONT_FAMILY,
    fontSize: 14,
    drawBoldTextInBrightColors: true,
    rightClickSelectsWord: true,
    theme: {
      foreground: '#FFFFFF',
      background: '#333333',
    },
  };

  const fitAddon = new FitAddon();
  const term = new Terminal(options);
  term.loadAddon(fitAddon);
  term.loadAddon(new WebLinksAddon());

  const [buffer, setBuffer] = useState({
    cursor: 0,
    bufferInput: '',
    bufferOutput: '',
  });

  // Ref to embed terminal
  const termContainer = React.useRef<HTMLDivElement | null>(null);

  // Initialize terminal
  useEffect(() => {
    console.log('Initializing terminal...');

    (async () => {
      console.log('Loading fonts...');
      const pFonts = Promise.all([
        new FontFaceObserver(SHELL_FONT_FAMILY).load(),
        new FontFaceObserver(SHELL_FONT_FAMILY, { weight: 'bold' }).load(),
      ]);

      console.log('start duckdb...');
      const pConn = startConnection();

      await pFonts;
      console.log('loaded fonts');

      // initialize terminal
      console.log('open terminal...');
      term.open(termContainer.current!);

      if (hasWebGL()) {
        console.log('enabling webgl rendering...');
        term.loadAddon(new WebglAddon());
      }

      fitAddon.fit();
      term.writeln('Hello from xterm.js');

      const conn = await pConn;
      term.writeln('db started.');
      term.writeln('');
      term.focus();

      console.log('set handler...');
      term.attachCustomKeyEventHandler((event) => {
        if (event.type === 'keydown') {
          switch (event.key) {
            case SpecialKeys.Enter:
              term.writeln('');
              (async () => {
                const res = await conn!.query(buffer.bufferInput);

                for (const batch of res.data) {
                  for (const b of batch.children) {
                    term.write(b.values.toString());
                  }
                  term.writeln('');
                }
              })();
              setBuffer(
                Object.assign(buffer, {
                  cursor: 0,
                  bufferInput: '',
                  bufferOutput: '',
                }),
              );

              break;
            case SpecialKeys.Backspace:
              if (buffer.cursor > 0) {
                term.write('\b \b');
                setBuffer(
                  Object.assign(buffer, {
                    cursor: buffer.cursor - 1,
                    bufferInput: buffer.bufferInput.substring(
                      0,
                      buffer.bufferInput.length - 1,
                    ),
                  }),
                );
              }
              break;
            default:
              if (event.ctrlKey) {
                // copy to clipboard, hence nothing to do
                if (event.key == 'c') break;
                // paste
                else if (event.key == 'v') {
                  (async () => {
                    const text = await navigator.clipboard.readText();
                    term.write(text);

                    setBuffer(
                      Object.assign(buffer, {
                        cursor: buffer.cursor + text.length,
                        bufferInput: buffer.bufferInput + text,
                        bufferOutput: buffer.bufferInput.length + text.length,
                      }),
                    );
                  })();
                  // ascii char input
                }
              } else if (!(event.key in SpecialKeys) && event.key.length == 1) {
                setBuffer(
                  Object.assign(buffer, {
                    cursor: buffer.cursor + 1,
                    bufferInput: buffer.bufferInput + event.key,
                    bufferOutput: buffer.bufferOutput + event.key,
                  }),
                );

                term.write(buffer.bufferOutput);
                setBuffer(Object.assign(buffer, { bufferOutput: '' }));
              }
          }
        }
        return false;
      });
    })();
  }, []);

  return (
    <div className="root">
      <div ref={termContainer} className="term_container"></div>
    </div>
  );
};
