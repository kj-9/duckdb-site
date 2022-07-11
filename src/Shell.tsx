import './Shell.css';
import 'xterm/css/xterm.css';

import * as duckdb from '@duckdb/duckdb-wasm';
import FontFaceObserver from 'fontfaceobserver';
import React, { useEffect, useState } from 'react';
import { ITerminalOptions, Terminal } from 'xterm';

import { startConnection } from './duckdb';
import { SpecialKeys } from './Keys';

export const Shell: React.FC = () => {
  // Ref to embed terminal
  const termContainer = React.useRef<HTMLDivElement | null>(null);

  const [buffer, setBuffer] = useState({
    cursor: 0,
    bufferInput: '',
    bufferOutput: '',
  });

  const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
      brightYellow: '#FFF000',
      foreground: '#FFFFFF',
      background: '#333',
    },
  };
  const [term, setTerm] = useState<Terminal>(new Terminal(options));

  // Initialize terminal
  React.useEffect(() => {
    console.log('use effect called');

    // load fonts
    (async () => {
      const regular = new FontFaceObserver(SHELL_FONT_FAMILY).load();
      const bold = new FontFaceObserver(SHELL_FONT_FAMILY, { weight: 'bold' }).load();

      await Promise.all([regular, bold]);
    })();

    // initialize terminal
    term.open(termContainer.current!);
    term.writeln('Hello from \x1B[1;3;31mxterm.js\x1B[0m');
    setTerm(term);

    // start db
    term.write('start duckdb...');
    startConnection().then((conn) => {
      setConn(conn);
      setIsLoaded(true);
      term.writeln('db started.');
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      console.log('set handler');
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
              if (!(event.key in SpecialKeys) && event.key.length == 1) {
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
    }
  }, [isLoaded]);

  return <div ref={termContainer} className="term_container"></div>;
};
