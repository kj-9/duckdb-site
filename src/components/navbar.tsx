import './navbar.css';

import React from 'react';

import icon_shell from '../../static/svg/icons/shell.svg';

export const NavBar: React.FC = (props) => {
  return (
    <div className="container">
      <div className="navbar">
        <div className="logo">
          <img
            src="https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.14.3/dist/img/duckdb.svg"
            alt="icon"
          />
        </div>
        <div className="tabs">
          <div className="tab">
            <div className="tabButton">
              <svg className="tabIcon" width="18px" height="18px">
                <use xlinkHref={`${icon_shell}#sym`} />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="page">{props.children}</div>
    </div>
  );
};
