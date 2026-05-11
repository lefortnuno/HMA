import "./skeleton.css";

/* ── Sk rows pour <tbody> (loyer matrix) ─────────────────── */
export function SkLoyerRows({ cols = 15 }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} style={{ padding: "10px 8px" }}>
              {c === 0
                ? <Sk w={24} h={22} className="sk-badge" />
                : c === 1
                ? <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Sk w={60} h={11} className="sk-h3" />
                    <Sk w={40} h={9}  className="sk-h4" />
                  </div>
                : <Sk w={52} h={22} className="sk-badge" style={{ margin: "0 auto" }} />
              }
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ── Bloc de base ─────────────────────────────────────────── */
export function Sk({ w = "100%", h, className = "", style = {} }) {
  return <span className={`sk ${className}`} style={{ width: w, height: h, ...style }} />;
}

/* ── Skeleton : liste locataires ─────────────────────────── */
export function SkLocataires() {
  const rows = [85, 72, 90, 68, 80, 75];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* page-header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Sk w={180} h={24} className="sk-h1 mb-2" />
          <Sk w={120} h={12} className="sk-h4" />
        </div>
        <Sk w={90} h={32} className="sk-btn" />
      </div>

      {/* table card */}
      <div className="sk-card p-0">
        <div className="p-3 border-bottom">
          <Sk w={160} h={16} className="sk-h2" />
        </div>
        {rows.map((w, i) => (
          <div className="sk-table-row" key={i}>
            <Sk w={28} h={22} className="sk-badge" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
              <Sk w={`${w}%`} h={13} className="sk-h3" />
              <Sk w="50%" h={10} className="sk-h4" />
            </div>
            <Sk w={80} h={13} className="sk-h3" style={{ flexShrink: 0 }} />
            <Sk w={70} h={13} className="sk-h3" style={{ flexShrink: 0 }} />
            <Sk w={60} h={22} className="sk-badge" style={{ flexShrink: 0 }} />
            <div className="d-flex gap-1">
              <Sk w={30} h={30} className="sk-btn" />
              <Sk w={30} h={30} className="sk-btn" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton : tableau loyer (matrice) ─────────────────── */
export function SkLoyer() {
  const cols = 13; // 12 mois + total
  const rows = 8;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Sk w={200} h={24} className="sk-h1 mb-2" />
          <Sk w={140} h={12} className="sk-h4" />
        </div>
        <div className="d-flex gap-2">
          <Sk w={80} h={32} className="sk-btn" />
          <Sk w={80} h={32} className="sk-btn" />
          <Sk w={110} h={32} className="sk-btn" />
        </div>
      </div>

      {/* stat cards */}
      <div className="row g-3 mb-2">
        {[1,2,3,4].map(i => (
          <div className="col-6 col-lg-3" key={i}>
            <div className="sk-stat">
              <Sk w={46} h={46} className="sk-circle" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <Sk w="70%" h={18} className="sk-h2" />
                <Sk w="90%" h={10} className="sk-h4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* matrix table */}
      <div className="sk-card p-0" style={{ overflowX: "auto" }}>
        <div className="p-3 border-bottom d-flex gap-2">
          <Sk w={120} h={16} className="sk-h2" />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {Array.from({ length: cols + 1 }).map((_, c) => (
                <th key={c} style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
                  <Sk w={c === 0 ? 80 : 36} h={10} className="sk-h4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} style={{ borderBottom: "1px solid #f1f5f9" }}>
                {Array.from({ length: cols + 1 }).map((_, c) => (
                  <td key={c} style={{ padding: "10px 12px" }}>
                    {c === 0
                      ? <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <Sk w={70} h={12} className="sk-h3" />
                          <Sk w={50} h={9}  className="sk-h4" />
                        </div>
                      : <Sk w={54} h={22} className="sk-badge" />
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Skeleton : bénéfices ─────────────────────────────────── */
export function SkBenefices() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <Sk w={160} h={24} className="sk-h1 mb-2" />
          <Sk w={200} h={12} className="sk-h4" />
        </div>
        <div className="d-flex gap-2">
          <Sk w={70} h={32} className="sk-btn" />
          <Sk w={70} h={32} className="sk-btn" />
        </div>
      </div>

      {/* 4 stat cards */}
      <div className="row g-3 mb-2">
        {[1,2,3,4].map(i => (
          <div className="col-sm-6 col-lg-3" key={i}>
            <div className="sk-stat">
              <Sk w={46} h={46} className="sk-circle" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <Sk w="65%" h={22} className="sk-h1" />
                <Sk w="85%" h={10} className="sk-h4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* résultat card */}
      <div className="sk-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Sk w={140} h={16} className="sk-h2" />
          <Sk w={80} h={24} className="sk-badge" />
        </div>
        <Sk w="100%" h={12} className="sk-h3 mb-2" />
        <Sk w="80%"  h={12} className="sk-h3 mb-2" />
        <Sk w="60%"  h={12} className="sk-h3" />
      </div>

      {/* dépenses table */}
      <div className="sk-card p-0">
        <div className="p-3 border-bottom"><Sk w={140} h={14} className="sk-h2" /></div>
        {[90,70,80,65].map((w, i) => (
          <div className="sk-table-row" key={i}>
            <Sk w={`${w}%`} h={13} className="sk-h3" />
            <Sk w={80} h={13} className="sk-h3" style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
