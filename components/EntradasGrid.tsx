"use client";

import { AgGridReact } from "ag-grid-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

// 🔥 AG GRID
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const getStrategyColumns = (columnDefs: any[]) => {
  const base = [
    "Fecha","Día semana","Par","Direc",
    "Link antes","Tamaño SL","Comentarios","Link después",
    "Fecha cierre","Duración","SL/TP",
    "Filtro 1","Filtro 2","Contabilizar","MIX"
  ];

  return columnDefs
    .map(c => c.field)
    .filter(field => field && !base.includes(field));
};
const getStrategies = (columnDefs: any[]) => {
  const base = [
    "Fecha","Día semana","Par","Direc",
    "Link antes","Tamaño SL","Comentarios","Link después",
    "Fecha cierre","Duración","SL/TP",
    "Filtro 1","Filtro 2","Contabilizar","MIX"
  ];

  return columnDefs
    .map(c => c.field)
    .filter(f => f && !base.includes(f));
};
const calcularMejores = (data: any[], strategies: string[]) => {

  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes"];

  const resultado: any = {};

  dias.forEach(dia => {

    const filas = data.filter(r =>
      r["Día semana"] === dia &&
      String(r["Contabilizar"]).toUpperCase() === "SI"
    );

    let mejor = null;
    let mejorValor = -Infinity;

    strategies.forEach(strat => {

      const suma = filas.reduce((acc, row) => {
        const val = parseFloat(row[strat]);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      if (suma > mejorValor) {
        mejorValor = suma;
        mejor = strat;
      }
    });

    resultado[dia] = mejor;
  });

  return resultado;
};
const parseFecha = (fecha: string) => {
  if (!fecha) return null;

  const [datePart, timePart] = fecha.split(" ");
  if (!datePart) return null;

  const [day, month, year] = datePart.split("/");
  const [hours = "00", minutes = "00"] = (timePart || "").split(":");

  const d = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes)
  );

  return isNaN(d.getTime()) ? null : d;
};

const getDiaSemana = (fecha: string) => {
  const d = parseFecha(fecha);
  if (!d) return "";

  const dias = [
    "Domingo","Lunes","Martes","Miércoles",
    "Jueves","Viernes","Sábado"
  ];

  return dias[d.getDay()];
};

const getDuracion = (inicio: string, fin: string) => {
  const d1 = parseFecha(inicio);
  const d2 = parseFecha(fin);

  if (!d1 || !d2) return "";

  const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
  return diff.toFixed(1);
};

export default function EntradasGrid() {

  const [rowData, setRowData] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const gridRef = useRef<any>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  const handleAddStrategy = () => {
    const name = prompt("Nombre de la estrategia");
    if (!name) return;

    if (columnDefs.some(col => col.field === name)) {
      alert("Ya existe esa estrategia");
      return;
    }

    setColumnDefs(prev => {
      const mixIndex = prev.findIndex(c => c.field === "MIX");

      // si no hay MIX → añadir al final
      if (mixIndex === -1) {
        return [...prev, createStrategyCol(name)];
      }

      const beforeMix = prev.slice(0, mixIndex + 1);
      const strategies = prev.slice(mixIndex + 1);

      return [
        ...beforeMix,
        ...strategies,
        createStrategyCol(name)
      ];
    });

    setRowData(prev =>
      prev.map(row => ({
        ...row,
        [name]: ""
      }))
    );
  };

  const createStrategyCol = (name: string) => ({
    field: name,
    editable: true,
    resizable: true,
    sortable: true,
    filter: "agNumberColumnFilter",
    width: 140
  });
  const handleDeleteStrategy = () => {
    const strategies = getStrategyColumns(columnDefs);

    if (strategies.length === 0) {
      alert("No hay estrategias");
      return;
    }

    const input = prompt(
      "Estrategias a borrar (separadas por coma):\n" +
      strategies.join(", ")
    );

    if (!input) return;

    const toDelete = input.split(",").map(s => s.trim());

    // eliminar columnas
    setColumnDefs(prev =>
      prev.filter(col => !toDelete.includes(col.field))
    );

    // eliminar datos
    setRowData(prev =>
      prev.map(row => {
        const newRow = { ...row };
        toDelete.forEach(col => delete newRow[col]);
        return newRow;
      })
    );
  };

  useEffect(() => {
    if (loaded) return;

    fetch(`/api/entradas`)
      .then(res => res.json())
      .then(data => {

        if (!Array.isArray(data)) data = [];

        if (!data || data.length === 0) {

          const COLUMN_ORDER = [
            "Fecha","Día semana","Par","Direc",
            "Link antes","Tamaño SL","Comentarios","Link después",
            "Fecha cierre","Duración","SL/TP",
            "Filtro 1","Filtro 2","Contabilizar","MIX"
          ];

          const cols = [
            {
              headerName: "Nº",
              valueGetter: "node.rowIndex + 1",
              width: 80,
              pinned: "left"
            },
            ...COLUMN_ORDER.map((key) => ({
              field: key,
              editable: true,
              width: 140
            }))
          ];

          // ✅ CREAR FILA VACÍA CORRECTAMENTE
          const emptyRow: any = { id: Date.now() };

          COLUMN_ORDER.forEach(col => {
            emptyRow[col] = "";
          });

          setColumnDefs(cols);
          setRowData([emptyRow]); // 👈 ahora sí existe
          setLoaded(true);

          return;
        }

        const allKeys = new Set<string>();

        data.forEach((row: any) => {
          Object.keys(row).forEach((key) => allKeys.add(key));
        });

        const COLUMN_ORDER = [
          "Fecha","Día semana","Par","Direc",
          "Link antes","Tamaño SL","Comentarios","Link después",
          "Fecha cierre","Duración","SL/TP",
          "Filtro 1","Filtro 2","Contabilizar","MIX"
        ];

        const orderedKeys = [
          ...COLUMN_ORDER,
          ...Array.from(allKeys).filter(k => !COLUMN_ORDER.includes(k) && k !== "id")
        ];

        const fixedColumns = ["Fecha", "Día semana", "Par", "Direc"];

        const cols = [
          {
            headerName: "Nº",
            valueGetter: "node.rowIndex + 1",
            width: 80,
            pinned: "left",
            sortable: false,
            filter: false
          },

          ...orderedKeys.map((key) => {

            const isLink = key === "Link antes" || key === "Link después";
            const isReadOnly = [
              "Día semana",
              "Duración",
              "SL/TP",
              "MIX"
            ].includes(key);

            return {
              field: key,
              editable: !isReadOnly,
              resizable: true,
              sortable: true,
              filter: "agSetColumnFilter",
              width: 140,
              pinned: fixedColumns.includes(key) ? "left" : undefined,

              cellStyle: isReadOnly
                ? { backgroundColor: "#111", color: "#888" }
                : undefined,

              cellRenderer: isLink
                ? (params: any) => {
                    if (!params.value) return null;

                    const handleClick = (e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(params.value, "_blank");
                    };

                    return (
                      <span
                        onClick={handleClick}
                        style={{ color: "#d4af37", cursor: "pointer" }}
                      >
                        VER
                      </span>
                    );
                  }
                : undefined
            };
          })
        ];

        setColumnDefs(cols);

        const cleaned = data.map((row: any, index: number) => {
          const newRow: any = { id: index };

          orderedKeys.forEach((key) => {
            newRow[key] = row[key] ?? "";
          });

          // 🔥 FORZAR filtros
          newRow["Filtro 1"] = newRow["Filtro 1"] ?? "";
          newRow["Filtro 2"] = newRow["Filtro 2"] ?? "";

          return newRow;
        });

        setRowData(cleaned);
        setLoaded(true);
      });
  }, [loaded]);
  useEffect(() => {
    if (!data.length) return;

    const timeout = setTimeout(() => {

      fetch("/api/entradas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      });

      console.log("💾 AUTOGUARDADO");

    }, 1000);

    return () => clearTimeout(timeout);

  }, [data]);


  const handleAddRow = () => {
    const newRow: any = {
      id: Date.now(),
      "Filtro 1": "",
      "Filtro 2": ""
    };

    columnDefs.forEach((col: any) => {
      if (col.field && newRow[col.field] === undefined) {
        newRow[col.field] = "";
      }
    });

    setRowData(prev => [...prev, newRow]);
  };

  const handleDeleteRow = () => {
    const input = prompt("¿Qué fila quieres borrar?");

    if (!input) return;

    const index = Number(input) - 1;

    if (isNaN(index) || index < 0 || index >= rowData.length) {
      alert("Fila no válida");
      return;
    }

    const newData = [...rowData];
    newData.splice(index, 1);

    setRowData(newData);
  };

  const handleSave = async () => {
    gridRef.current.api.stopEditing();

    const strategies = getStrategies(columnDefs);

    const rows: any[] = [];

    gridRef.current.api.forEachNode((node: any) => {
      rows.push({ ...node.data });
    });

    let newData = rows.map(row => {

      const newRow = { ...row };

      // 🔥 DÍA SEMANA (FALTABA)
      newRow["Día semana"] = getDiaSemana(newRow["Fecha"]);

      // 🔥 DURACIÓN
      newRow["Duración"] = getDuracion(
        newRow["Fecha"],
        newRow["Fecha cierre"]
      );

      return newRow;
    });

    // 🔥 MEJORES ESTRATEGIAS
    const mejores = calcularMejores(newData, strategies);

    // 🔥 MIX
    newData = newData.map(row => {

      const dia = row["Día semana"];
      const mejor = mejores[dia];

      if (mejor && row[mejor] !== undefined) {
        row["MIX"] = row[mejor];
      } else {
        row["MIX"] = "";
      }

      return row;
    });
    // 🔥 SL/TP basado en MIX
    newData = newData.map(row => {

      const val = parseFloat(row["MIX"]);

      if (!isNaN(val)) {
        row["SL/TP"] = val >= 0 ? "TP" : "SL";
      } else {
        row["SL/TP"] = "";
      }

      return row;
    });

    // 🔥 guardar en estado
    setRowData(newData);

    // 🔥 enviar a backend
    await fetch("/api/entradas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: newData
      })
    });

    setRowData(newData);

    alert("Guardado");
  };

  return (
    <div>

      {/* BOTONES */}
      <div className="mb-3 flex gap-2 flex-wrap">

        <button
          onClick={handleAddRow}
          className="px-4 py-2 bg-[#111] text-[#d4af37] border border-[#d4af37] rounded-lg hover:bg-[#d4af37] hover:text-black transition-all shadow-md active:scale-95"
        >
          ➕ Añadir fila
        </button>

        <button
          onClick={handleDeleteRow}
          className="px-4 py-2 bg-[#111] text-[#d4af37] border border-[#d4af37] rounded-lg hover:bg-[#d4af37] hover:text-black transition-all shadow-md active:scale-95"
        >
          🗑️ Borrar fila
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#111] text-[#d4af37] border border-[#d4af37] rounded-lg hover:bg-[#d4af37] hover:text-black transition-all shadow-md active:scale-95"
        >
          💾 Guardar
        </button>

        <button
          onClick={handleAddStrategy}
          className="px-4 py-2 bg-[#111] text-[#d4af37] border border-[#d4af37] rounded-lg hover:bg-[#d4af37] hover:text-black transition-all shadow-md active:scale-95"
        >
          ➕ Añadir estrategia
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-[#111] text-[#d4af37] border border-[#d4af37] rounded-lg hover:bg-[#d4af37] hover:text-black transition-all shadow-md active:scale-95"
        >
          🗑️ Borrar estrategia
        </button>

      </div>
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}
        >
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 min-w-[300px] shadow-xl animate-[fadeIn_0.2s_ease]">

            <h3 className="text-[#d4af37] text-lg mb-4 text-center font-bold">
              Borrar estrategias
            </h3>

            {/* CHECKBOXES */}
            <div className="flex flex-col gap-2 mb-6 max-h-[200px] overflow-y-auto">
              {getStrategyColumns(columnDefs).map((col) => (
                <label
                  key={col}
                  className="flex items-center gap-2 text-white cursor-pointer hover:text-[#d4af37]"
                >
                  <input
                    type="checkbox"
                    className="accent-[#d4af37]"
                    checked={selectedStrategies.includes(col)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStrategies(prev => [...prev, col]);
                      } else {
                        setSelectedStrategies(prev =>
                          prev.filter(c => c !== col)
                        );
                      }
                    }}
                  />
                  {col}
                </label>
              ))}
            </div>

            {/* BOTONES */}
            <div className="flex justify-between gap-3">

              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-all"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  setColumnDefs(prev =>
                    prev.filter(col => !selectedStrategies.includes(col.field))
                  );

                  setRowData(prev =>
                    prev.map(row => {
                      const newRow = { ...row };
                      selectedStrategies.forEach(c => delete newRow[c]);
                      return newRow;
                    })
                  );

                  setShowDeleteModal(false);
                  setSelectedStrategies([]);
                }}
                className="flex-1 px-4 py-2 border border-red-700 text-red-400 rounded-lg hover:bg-red-700 hover:text-white transition-all"
              >
                Confirmar
              </button>

            </div>

          </div>
        </div>
      )}

      {/* GRID */}
      <div className="ag-theme-alpine" style={{ height: 500, width: "100%" }}>
        <AgGridReact
          //theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          popupParent={typeof window !== "undefined" ? document.body : undefined}
          enterNavigatesVertically={true}
          enterNavigatesVerticallyAfterEdit={true}
          singleClickEdit={false}
          getRowId={(params) => String(params.data.id)}
          stopEditingWhenCellsLoseFocus={true}
          suppressMenuHide={false}
          animateRows={true}
          ref={gridRef}
          enableFilterHandlers={true}
          defaultColDef={{
            editable: true,
            resizable: true,
            sortable: true,
            filter: "agSetColumnFilter", 
            suppressMovable: true,
            cellStyle: {
              textAlign: "center",
              alignItems: "center",
              justifyContent: "center"
            }
          }}
          onFirstDataRendered={(params) => {
            const allCols: string[] = [];

            params.api.getColumns()?.forEach(col => {
              allCols.push(col.getColId());
            });

            params.api.autoSizeColumns(allCols);
          }}
          onCellValueChanged={(params) => {

            const row = params.data;

            if (params.colDef.field === "Fecha") {
              row["Día semana"] = getDiaSemana(row["Fecha"]);
            }

            if (
              params.colDef.field === "Fecha" ||
              params.colDef.field === "Fecha cierre"
            ) {
              row["Duración"] = getDuracion(
                row["Fecha"],
                row["Fecha cierre"]
              );
            }

            const rows: any[] = [];

            gridRef.current.api.forEachNode((node: any) => {
              rows.push({ ...node.data });
            });

            setData(rows);

            params.api.refreshCells({
              rowNodes: [params.node],
              force: true
            });
          }}
        />
      </div>
    </div>
  );
}