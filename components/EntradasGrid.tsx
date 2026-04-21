"use client";

import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import { useState } from "react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function TestGrid() {

  const [rowData] = useState([
    { Fecha: "01/01/2024", Par: "EURUSD", Resultado: "TP" },
    { Fecha: "02/01/2024", Par: "GBPUSD", Resultado: "SL" },
    { Fecha: "03/01/2024", Par: "EURUSD", Resultado: "TP" },
  ]);

  const columnDefs: any[] = [
    { field: "Fecha", filter: "agSetColumnFilter" },
    { field: "Par", filter: "agSetColumnFilter" },
    { field: "Resultado", filter: "agSetColumnFilter" },
  ];

  return (
    <div className="ag-theme-alpine" style={{ height: 400 }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        popupParent={typeof window !== "undefined" ? document.body : undefined}
      />
    </div>
  );
}