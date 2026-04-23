"use client";

import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
} from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useState, useEffect, useRef } from "react";
ModuleRegistry.registerModules([AllCommunityModule]);

export default function TestGrid() {
  const parseFecha = (fecha: string) => {
    if (!fecha) return null;

    // formato: dd/mm/yyyy hh:mm
    const [datePart, timePart] = fecha.split(" ");

    if (!datePart) return null;

    const [day, month, year] = datePart.split("/").map(Number);

    let hours = 0;
    let minutes = 0;

    if (timePart) {
      const parts = timePart.split(":");
      hours = Number(parts[0]) || 0;
      minutes = Number(parts[1]) || 0;
    }

    return new Date(year, month - 1, day, hours, minutes);
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [rowData, setRowData] = useState<any[]>([]);
  const diasSemana = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

  const getDiaSemana = (fecha: string) => {
    const d = parseFecha(fecha);
    if (!d) return "";
    return diasSemana[d.getDay()];
  };

  const getDuracion = (f1: string, f2: string) => {
    const d1 = parseFecha(f1);
    const d2 = parseFecha(f2);

    if (!d1 || !d2) return "";

    const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);

    return diff.toFixed(2); // 👈 2 decimales (puedes poner 1 si quieres)
  };
  const calcularMejores = (data: any[], strategies: string[]) => {
    const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes"];
    const res: any = {};

    dias.forEach(dia => {
      const filas = data.filter(r =>
        r["Día semana"] === dia &&
        String(r["Contabilizar"]).toUpperCase() === "SI"
      );

      let mejor = null;
      let mejorVal = -Infinity;

      strategies.forEach(s => {
        const suma = filas.reduce((acc, row) => {
          const val = parseFloat(row[s]);
          return acc + (isNaN(val) ? 0 : val);        

        }, 0);

        if (suma > mejorVal) {
          mejorVal = suma;
          mejor = s;
        }
      });

      res[dia] = mejor;
    });

    return res;
  };
  const recalcularCampos = (data: any[], columnDefs: any[]) => {

    const strategyCols = columnDefs
      .map(c => c.field)
      .filter(f =>
        !COLUMN_ORDER.includes(f) && f !== "id"
      );

    // 🔥 1. calcular día y duración
    const newData = data.map(row => {

      const dia = getDiaSemana(row["Fecha"]);
      const dur = getDuracion(row["Fecha"], row["Fecha cierre"]);

      return {
        ...row,
        "Día semana": dia,
        "Duración": dur
      };
    });

    // 🔥 2. calcular mejores estrategias
    const mejores = calcularMejores(newData, strategyCols);

    // 🔥 3. calcular MIX + SL/TP
    return newData.map(row => {

      const mejor = mejores[row["Día semana"]];

      const raw = mejor ? row[mejor] : null;

      const num = Number(raw);

      const val =
        raw === null || raw === undefined || raw === "" || isNaN(num)
          ? null
          : num;

      const mix = val ?? "";

      let sltp = "";
      if (val !== null) {
        sltp = val >= 0 ? "TP" : "SL";
      }

      return {
        ...row,
        "MIX": mix,
        "SL/TP": sltp
      };
    });
  };
  // 🔥 ESTADO GLOBAL (clave)
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const pares = [...new Set(rowData.map(r => r.Par))];
  const resultados = [...new Set(rowData.map(r => r.Resultado))];
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const gridRef = useRef<any>(null);
  // 🔥 TOGGLE GLOBAL
  const toggle = (field: string, value: string) => {
    setFilters(prev => {
      const current = prev[field] || [];

      let newValues;

      if (current.includes(value)) {
        newValues = current.filter(v => v !== value);
      } else {
        newValues = [...current, value];
      }

      const updated = {
        ...prev,
        [field]: newValues,
      };

      return updated;
    });
  };

  // 🔥 FILTRADO REAL
  const filteredData = rowData.filter(row => {
    return Object.entries(filters).every(([field, values]) => {
      if (!values.length) return true;
      return values.includes(row[field]);
    });
  });

  // 🔥 HEADER
  const DropdownHeader = (field: string, options: string[], filters: any) => {
    return function Header() {

      const [open, setOpen] = useState(false);
      const [position, setPosition] = useState({ top: 0, left: 0 });

      const selected = filters[field] || [];

      return (
        <div>
          <div
            style={{ cursor: "pointer", fontWeight: "bold" }}
            onClick={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();

              setPosition({
                top: rect.bottom,
                left: rect.left,
              });

              setOpen(prev => !prev);
            }}
          >
            {field} ⏷ {selected.length ? `(${selected.length})` : ""}
          </div>

          {open && (
            <div
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                background: "#111",
                border: "1px solid #444",
                padding: 8,
                zIndex: 999999,
                minWidth: 150,
                maxHeight: 200,
                overflowY: "auto",
                color: "#fff"
              }}
            >

              <div
                style={{
                  marginBottom: 6,
                  cursor: "pointer",
                  color: "#d4af37",
                  fontWeight: "bold"
                }}
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    [field]: [],
                  }))
                }
              >
                Limpiar
              </div>

              {options.map(opt => (
                <div
                  key={opt}
                  onClick={() => toggle(field, opt)}
                  style={{
                    padding: "6px 8px",
                    marginBottom: 4,
                    cursor: "pointer",
                    borderRadius: 4,
                    background: selected.includes(opt) ? "#d4af37" : "#1a1a1a",
                    color: selected.includes(opt) ? "#000" : "#fff",
                    fontWeight: selected.includes(opt) ? "bold" : "normal",
                    border: "1px solid #444",
                    transition: "all 0.15s ease"
                  }}
                >
                  {opt}
                </div>
                ))}


            </div>
          )}
        </div>
      );
    };
  };
  const readOnlyCols = ["Día semana", "Duración", "SL/TP", "MIX", "id"];
  const COLUMN_ORDER = [
    "Fecha","Día semana","Par","Direc",
    "Link antes","Tamaño SL","Comentarios","Link después",
    "Fecha cierre","Duración","SL/TP",
    "Filtro 1","Filtro 2","Contabilizar","MIX"
  ];
  const linkRenderer = (params: any) => {
    if (!params.value) return "";

    return (
      <a href={params.value} target="_blank" rel="noopener noreferrer">
        ver
      </a>
    );
  };
  useEffect(() => {
    fetch("/api/entradas")
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;

        // ✅ SIEMPRE definidas
        const baseKeys = ["id", ...COLUMN_ORDER];

        // 👉 CASO USUARIO SIN DATOS
        if (data.length === 0) {
          const cols = baseKeys.map(key => ({
            field: key,
            editable: !readOnlyCols.includes(key),
            suppressMovable: true,
          }));

          setColumnDefs(cols);

          // 🔥 OPCIONAL → fila vacía inicial
          setRowData([
            Object.fromEntries(
              baseKeys.map(k => [k, k === "id" ? 1 : ""])
            )
          ]);

          return;
        }

        // 👉 USUARIO CON DATOS
        const keys = Object.keys(data[0]);

        const baseKeysFiltered = baseKeys.filter(k => keys.includes(k));

        const strategyKeys = keys
          .filter(k => !baseKeysFiltered.includes(k))
          .sort();

        const orderedKeys = [
          ...baseKeysFiltered,
          ...strategyKeys
        ];

        const pinnedCols = ["id", "Fecha", "Día semana", "Par", "Direc"];

        const cols = orderedKeys.map(key => {

          const values = [...new Set(
            data.map(r => r[key]).filter(v => v !== undefined && v !== null && v !== "")
          )];
          const maxLength = Math.max(
            key.length,
            ...data.map(r => (r[key] ? String(r[key]).length : 0))
          );

          const width = Math.min(250, Math.max(120, maxLength * 7));
          const isDateColumn =
            key === "Fecha" || key === "Fecha cierre";

          const isLink =
            key === "Link antes" || key === "Link después";

          return {
            field: key,
            width:
              key === "id" ? 70 :
              isLink ? 90 :
              isDateColumn ? 180 :
              width,

            editable: !readOnlyCols.includes(key),

            headerComponent: DropdownHeader(key, values, filters),

            pinned: pinnedCols.includes(key) ? "left" : undefined,
            suppressMovable: true,
            cellRenderer: isLink ? linkRenderer : undefined,

            // 🔥 AÑADE ESTO SOLO PARA MIX
            valueGetter: key === "MIX"
              ? (params: any) => params.data["MIX"] || ""
              : undefined,

            valueFormatter: key === "MIX"
              ? (params: any) => params.value === "" ? "" : params.value
              : undefined,
          };
        });

        setColumnDefs(cols);
        setRowData(recalcularCampos(data, cols));
      });
  }, []);
  useEffect(() => {
    setColumnDefs(prev =>
      prev.map(col => ({
        ...col,
        headerComponent: DropdownHeader(col.field, 
          [...new Set(rowData.map(r => r[col.field]).filter(v => v))],
          filters
        )
      }))
    );
  }, [filters]);
  return (
    <div>

      {/* 🔹 BOTONES */}
      <div style={{ marginBottom: 10, display: "flex", gap: 10 }}>

        <button
          className="toolbar-btn"
          onClick={() => {
            const newId = Math.max(0, ...rowData.map(r => r.id || 0)) + 1;

            const emptyRow: any = { id: newId };
            columnDefs.forEach(col => {
              if (col.field !== "id") emptyRow[col.field] = "";
            });

            setRowData(prev => {
              const updated = [...prev, emptyRow];
              return recalcularCampos(updated, columnDefs);
            });
          }}
        >
          ➕ Añadir fila
        </button>

        <button
          className="toolbar-btn"
          onClick={() => {
            const id = prompt("Introduce el ID a borrar");
            if (!id) return;

            setRowData(prev => {
              const updated = prev.filter(r => String(r.id) !== id);
              return recalcularCampos(updated, columnDefs);
            });
          }}
        >
          ❌ Borrar fila
        </button>

        <button
          className="toolbar-btn"
          onClick={async () => {
            const res = await fetch("/api/entradas", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ data: rowData })
            });

            const result = await res.json();
            console.log(result);

            alert("Guardado en Neon ✅");
          }}
        >
          💾 Guardar
        </button>

        <button
          className="toolbar-btn"
          onClick={() => {
            const name = prompt("Nombre de la estrategia");
            if (!name) return;

            setColumnDefs(prev => {
              // 🔥 separar columnas base vs estrategias
              const baseCols = prev.filter(c =>
                COLUMN_ORDER.includes(c.field) || c.field === "id"
              );

              const strategyCols = prev.filter(c =>
                !COLUMN_ORDER.includes(c.field) && c.field !== "id"
              );

              return [
                ...baseCols,
                ...strategyCols,
                {
                  field: name,
                  editable: true,
                  suppressMovable: true,
                }
              ];
            });

            setRowData(prev => {
              const updated = prev.map(r => ({ ...r, [name]: "" }));
              return recalcularCampos(updated, columnDefs);
            });
          }}
        >
          ➕ Añadir estrategia
        </button>

        <button
          className="toolbar-btn"
          onClick={() => setShowDeleteModal(true)}
            
        >
          ❌ Borrar estrategia
        </button>

      </div>

      {/* 🔹 MODAL BORRAR */}
      {showDeleteModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#111",
            padding: 20,
            border: "1px solid #444",
            borderRadius: 8,
            color: "#fff",
            minWidth: 300
          }}>

            <h3>Eliminar estrategias</h3>

            {columnDefs
              .map(c => c.field)
              .filter(f => !COLUMN_ORDER.includes(f) && f !== "id")
              .map(strategy => (
                <label key={strategy} style={{ display: "block" }}>
                  <input
                    type="checkbox"
                    checked={selectedStrategies.includes(strategy)}
                    onChange={() => {
                      setSelectedStrategies(prev =>
                        prev.includes(strategy)
                          ? prev.filter(s => s !== strategy)
                          : [...prev, strategy]
                      );
                    }}
                    style={{
                      accentColor: "#d4af37",
                      cursor: "pointer"
                    }}
                  />
                  {strategy}
                </label>
              ))}

            <div style={{ marginTop: 15, display: "flex", gap: 10 }}>
              <button
                className="toolbar-btn"
                onClick={() => {
                  setColumnDefs(prev =>
                    prev.filter(c => !selectedStrategies.includes(c.field))
                  );

                  setRowData(prev => {
                    const updated = prev.map(r => {
                      const newRow = { ...r };
                      selectedStrategies.forEach(s => delete newRow[s]);
                      return newRow;
                    });

                    return recalcularCampos(updated, columnDefs);
                  });

                  setSelectedStrategies([]);
                  setShowDeleteModal(false);
                }}
              >
                Eliminar
              </button>

              <button
                className="toolbar-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 🔹 GRID */}
      <div className="ag-theme-alpine" style={{ height: 400 }}>
        <AgGridReact<any>
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          defaultColDef={{
            editable: true,
            resizable: true,
            headerClass: "center-header",
            minWidth: 120,
            cellStyle: {
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }
          }}
          suppressMovableColumns={true}
        />
      </div>

    </div>
  );
 

}