import { useState, useEffect } from "react";

const domainColorMap = {
  "Data & AI": "#F59E0B",
  "Web Dev": "#10B981",
  "Cloud & DevOps": "#3B82F6",
  Security: "#EF4444",
  Mobile: "#8B5CF6",
  "Design & UX": "#EC4899",
};

const TrendBadge = ({ trend }) => {
  const up = trend > 0;
  const neutral = trend === 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: neutral ? "#6B7280" : up ? "#10B981" : "#EF4444",
        background: neutral ? "#1F2937" : up ? "#052e16" : "#1f0707",
        border: `1px solid ${neutral ? "#374151" : up ? "#065f46" : "#450a0a"}`,
        borderRadius: 4,
        padding: "2px 6px",
      }}
    >
      {neutral ? "—" : up ? `▲ +${trend}%` : `▼ ${trend}%`}
    </span>
  );
};

const MiniBar = ({ value, max, color }) => (
  <div
    style={{
      width: "100%",
      height: 4,
      background: "#1F2937",
      borderRadius: 2,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${max ? (value / max) * 100 : 0}%`,
        height: "100%",
        background: color || "#F59E0B",
        borderRadius: 2,
        transition: "width 1s ease",
      }}
    />
  </div>
);

const PhaseCard = ({ phase, duration, skills, index }) => (
  <div
    style={{
      background: "#0D1117",
      border: "1px solid #21262D",
      borderRadius: 8,
      padding: "14px 16px",
      animation: `fadeUp 0.4s ease ${index * 0.08}s both`,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#161B22",
            border: "2px solid #F59E0B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 800,
            color: "#F59E0B",
          }}
        >
          {index + 1}
        </div>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: "#F0F6FF",
          }}
        >
          {phase}
        </span>
      </div>
      <span style={{ fontSize: 10, color: "#6B7280", fontFamily: "monospace" }}>
        {duration}
      </span>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {skills.map((s) => (
        <span
          key={s}
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 12,
            background: "#161B22",
            color: "#9CA3AF",
            border: "1px solid #21262D",
          }}
        >
          {s}
        </span>
      ))}
    </div>
  </div>
);

const MiniLineChart = ({ data }) => {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.jobs));
  const min = Math.min(...data.map((d) => d.jobs));
  const w = 200,
    h = 48;

  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((d.jobs - min) / (max - min || 1)) * (h - 8) - 4;
    return `${x},${y}`;
  });

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${pts.join(" ")} ${w},${h}`}
        fill="url(#lineGrad)"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const [x, y] = pts[i].split(",");
        return <circle key={i} cx={x} cy={y} r="3" fill="#F59E0B" />;
      })}
    </svg>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("skills");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [filterDomain, setFilterDomain] = useState("All");
  const [mounted, setMounted] = useState(false);

  const [overview, setOverview] = useState(null);
  const [skillRankings, setSkillRankings] = useState([]);
  const [domainsData, setDomainsData] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setMounted(true);
        setLoading(true);

        const [overviewRes, skillsRes, domainsRes, trendRes] =
          await Promise.all([
            fetch("/data/overview.json"),
            fetch("/data/skill-rankings.json"),
            fetch("/data/domains.json"),
            fetch("/data/weekly-trend.json"),
          ]);

        if (
          !overviewRes.ok ||
          !skillsRes.ok ||
          !domainsRes.ok ||
          !trendRes.ok
        ) {
          throw new Error("Failed to load dashboard data");
        }

        const [overviewJson, skillsJson, domainsJson, trendJson] =
          await Promise.all([
            overviewRes.json(),
            skillsRes.json(),
            domainsRes.json(),
            trendRes.json(),
          ]);

        setOverview(overviewJson);
        setSkillRankings(skillsJson);
        setDomainsData(domainsJson);
        setWeeklyTrend(trendJson);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const domains = ["All", ...Object.keys(domainColorMap)];
  const filtered =
    filterDomain === "All"
      ? skillRankings
      : skillRankings.filter((s) => s.domain === filterDomain);

  const maxCount = skillRankings.length
    ? Math.max(...skillRankings.map((s) => s.count))
    : 0;

  const activeDomain = selectedDomain
    ? domainsData.find((d) => d.id === selectedDomain)
    : null;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0E17",
          color: "#E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0A0E17",
          color: "#EF4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Failed to load dashboard data: {error}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0E17",
        fontFamily: "'DM Sans', sans-serif",
        color: "#E5E7EB",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.5s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0E17; }
        ::-webkit-scrollbar-thumb { background: #21262D; border-radius: 2px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .skill-row:hover { background: #111827 !important; }
        .domain-card:hover { border-color: var(--dc) !important; transform: translateY(-2px); }
        .tab-btn:hover { color: #F0F6FF !important; }
        .filter-btn:hover { background: #1F2937 !important; }
        .resource-tag:hover { border-color: #F59E0B !important; color: #F59E0B !important; }
      `}</style>

      <div
        style={{
          borderBottom: "1px solid #161B22",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          position: "sticky",
          top: 0,
          background: "#0A0E17",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "#F59E0B",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 16 }}>🇹🇹</span>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: "#F0F6FF",
                letterSpacing: "-0.02em",
              }}
            >
              TT Tech Pulse
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#4B5563",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Trinidad & Tobago · Job Market Intelligence
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10,
                color: "#4B5563",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Last scraped
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6B7280",
                fontFamily: "monospace",
              }}
            >
              {overview.lastUpdated}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#0D1117",
              border: "1px solid #10B981",
              borderRadius: 20,
              padding: "4px 10px",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10B981",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>
              Live
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderBottom: "1px solid #161B22",
        }}
      >
        {[
          {
            label: "Tech Jobs Active",
            value: overview.totalJobs,
            sub: `+${overview.newToday} today`,
          },
          {
            label: "Skills Tracked",
            value: overview.skillsTracked,
            sub: "across all domains",
          },
          {
            label: "Domains Mapped",
            value: overview.domainsMapped,
            sub: "tech clusters",
          },
          {
            label: "Weekly Growth",
            value: `+${overview.weeklyGrowth}%`,
            sub: "vs last month",
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              padding: "18px 28px",
              borderRight: i < 3 ? "1px solid #161B22" : "none",
              animation: `fadeUp 0.4s ease ${i * 0.1}s both`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#4B5563",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 4,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 26,
                fontWeight: 800,
                color: "#F0F6FF",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "0 32px",
          borderBottom: "1px solid #161B22",
          display: "flex",
          gap: 0,
        }}
      >
        {[
          { id: "skills", label: "Skill Rankings" },
          { id: "domains", label: "Domain Map" },
          { id: "learning", label: "Learning Paths" },
        ].map((tab) => (
          <button
            key={tab.id}
            className="tab-btn"
            onClick={() => {
              setActiveTab(tab.id);
              setSelectedDomain(null);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "14px 20px",
              fontSize: 13,
              fontWeight: 500,
              color: activeTab === tab.id ? "#F59E0B" : "#6B7280",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #F59E0B"
                  : "2px solid transparent",
              marginBottom: -1,
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {activeTab === "skills" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 280px",
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                {domains.map((d) => (
                  <button
                    key={d}
                    className="filter-btn"
                    onClick={() => setFilterDomain(d)}
                    style={{
                      background:
                        filterDomain === d
                          ? domainColorMap[d] || "#F59E0B"
                          : "#111827",
                      border: `1px solid ${filterDomain === d ? "transparent" : "#21262D"}`,
                      color: filterDomain === d ? "#0A0E17" : "#9CA3AF",
                      borderRadius: 20,
                      padding: "5px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div
                style={{
                  background: "#0D1117",
                  border: "1px solid #161B22",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr 80px 120px 80px",
                    padding: "10px 16px",
                    borderBottom: "1px solid #161B22",
                    fontSize: 10,
                    color: "#4B5563",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  <span>#</span>
                  <span>Skill</span>
                  <span>Domain</span>
                  <span>Job mentions</span>
                  <span>Trend</span>
                </div>
                {filtered.map((skill, i) => (
                  <div
                    key={skill.skill}
                    className="skill-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "36px 1fr 80px 120px 80px",
                      padding: "12px 16px",
                      borderBottom: "1px solid #0F1419",
                      alignItems: "center",
                      transition: "background 0.15s",
                      animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: "#4B5563",
                        fontFamily: "monospace",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#E5E7EB",
                          marginBottom: 5,
                        }}
                      >
                        {skill.skill}
                      </div>
                      <MiniBar
                        value={skill.count}
                        max={maxCount}
                        color={domainColorMap[skill.domain]}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: "#111827",
                        color: domainColorMap[skill.domain] || "#9CA3AF",
                        border: `1px solid ${domainColorMap[skill.domain] || "#374151"}22`,
                      }}
                    >
                      {skill.domain.split(" ")[0]}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: "'DM Mono', monospace",
                        color: "#9CA3AF",
                      }}
                    >
                      {skill.count}{" "}
                      <span style={{ fontSize: 10, color: "#4B5563" }}>
                        jobs
                      </span>
                    </span>
                    <TrendBadge trend={skill.trend} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  background: "#0D1117",
                  border: "1px solid #161B22",
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#4B5563",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 14,
                  }}
                >
                  Weekly Job Volume
                </div>
                <MiniLineChart data={weeklyTrend} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  {weeklyTrend.map((d) => (
                    <span
                      key={d.week}
                      style={{
                        fontSize: 9,
                        color: "#4B5563",
                        fontFamily: "monospace",
                      }}
                    >
                      {d.week.replace("Feb ", "B").replace("Mar ", "M")}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "#0D1117",
                  border: "1px solid #161B22",
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#4B5563",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 14,
                  }}
                >
                  🔥 Fastest Rising
                </div>
                {[...skillRankings]
                  .sort((a, b) => b.trend - a.trend)
                  .slice(0, 5)
                  .map((s) => (
                    <div
                      key={s.skill}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#E5E7EB" }}>
                        {s.skill}
                      </span>
                      <TrendBadge trend={s.trend} />
                    </div>
                  ))}
              </div>

              <div
                style={{
                  background: "#0D1117",
                  border: "1px solid #161B22",
                  borderRadius: 10,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#4B5563",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 14,
                  }}
                >
                  Jobs by Domain
                </div>
                {domainsData.map((d) => (
                  <div key={d.id} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 12, color: d.color }}>
                        {d.name}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          fontFamily: "monospace",
                        }}
                      >
                        {d.jobs}
                      </span>
                    </div>
                    <MiniBar value={d.jobs} max={94} color={d.color} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "domains" && !selectedDomain && (
          <div>
            <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 24 }}>
              Tech roles in Trinidad & Tobago cluster into {domainsData.length}{" "}
              distinct domains. Select one to explore.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {domainsData.map((domain, i) => (
                <div
                  key={domain.id}
                  className="domain-card"
                  style={{
                    "--dc": domain.color,
                    background: "#0D1117",
                    border: "1px solid #21262D",
                    borderRadius: 12,
                    padding: 24,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
                  }}
                  onClick={() => {
                    setSelectedDomain(domain.id);
                    setActiveTab("learning");
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: 17,
                        color: "#F0F6FF",
                      }}
                    >
                      {domain.name}
                    </div>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 20,
                        fontWeight: 700,
                        color: domain.color,
                      }}
                    >
                      {domain.jobs}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      lineHeight: 1.6,
                      marginBottom: 14,
                    }}
                  >
                    {domain.description}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {domain.topSkills.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 11,
                          padding: "2px 9px",
                          borderRadius: 12,
                          background: `${domain.color}14`,
                          color: domain.color,
                          border: `1px solid ${domain.color}30`,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: 16,
                      fontSize: 11,
                      color: domain.color,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                    }}
                  >
                    View learning path →
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "learning" && (
          <div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 28,
                flexWrap: "wrap",
              }}
            >
              {domainsData.map((d) => (
                <button
                  key={d.id}
                  className="filter-btn"
                  onClick={() => setSelectedDomain(d.id)}
                  style={{
                    background: selectedDomain === d.id ? d.color : "#111827",
                    border: `1px solid ${selectedDomain === d.id ? "transparent" : "#21262D"}`,
                    color: selectedDomain === d.id ? "#0A0E17" : "#9CA3AF",
                    borderRadius: 20,
                    padding: "6px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {d.name}
                </button>
              ))}
            </div>

            {!selectedDomain && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 0",
                  color: "#4B5563",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
                <div style={{ fontSize: 14 }}>
                  Select a domain above to view its learning path
                </div>
              </div>
            )}

            {selectedDomain && activeDomain && (
              <div style={{ animation: "fadeUp 0.3s ease both" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#F0F6FF",
                        marginBottom: 4,
                      }}
                    >
                      {activeDomain.name}
                      <span
                        style={{
                          fontSize: 14,
                          color: activeDomain.color,
                          marginLeft: 12,
                          fontWeight: 600,
                        }}
                      >
                        {activeDomain.jobs} active jobs
                      </span>
                    </h2>
                    <p
                      style={{ fontSize: 13, color: "#6B7280", maxWidth: 560 }}
                    >
                      {activeDomain.description}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 240px",
                    gap: 24,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#4B5563",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 14,
                      }}
                    >
                      Roadmap · {activeDomain.learningPath.length} phases
                    </div>

                    <div style={{ position: "relative", paddingLeft: 20 }}>
                      <div
                        style={{
                          position: "absolute",
                          left: 10,
                          top: 0,
                          bottom: 0,
                          width: 1,
                          background: `linear-gradient(to bottom, ${activeDomain.color}, transparent)`,
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        {activeDomain.learningPath.map((phase, i) => (
                          <PhaseCard key={i} {...phase} index={i} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        background: "#0D1117",
                        border: "1px solid #161B22",
                        borderRadius: 10,
                        padding: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#4B5563",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: 14,
                        }}
                      >
                        Top Skills to Learn
                      </div>
                      {activeDomain.topSkills.map((s, i) => (
                        <div
                          key={s}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 10,
                            animation: `fadeUp 0.3s ease ${i * 0.06}s both`,
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              background: `${activeDomain.color}20`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 800,
                              color: activeDomain.color,
                            }}
                          >
                            {i + 1}
                          </div>
                          <span style={{ fontSize: 13, color: "#E5E7EB" }}>
                            {s}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        background: "#0D1117",
                        border: "1px solid #161B22",
                        borderRadius: 10,
                        padding: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#4B5563",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: 14,
                        }}
                      >
                        Recommended Resources
                      </div>
                      {activeDomain.resources.map((r) => (
                        <div
                          key={r}
                          className="resource-tag"
                          style={{
                            fontSize: 12,
                            padding: "6px 12px",
                            borderRadius: 6,
                            marginBottom: 8,
                            background: "#111827",
                            color: "#9CA3AF",
                            border: "1px solid #21262D",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          ↗ {r}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        background: `linear-gradient(135deg, ${activeDomain.color}18, transparent)`,
                        border: `1px solid ${activeDomain.color}30`,
                        borderRadius: 10,
                        padding: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: activeDomain.color,
                          marginBottom: 8,
                        }}
                      >
                        📄 Domain Resume
                      </div>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#6B7280",
                          lineHeight: 1.6,
                          marginBottom: 12,
                        }}
                      >
                        A tailored resume template for {activeDomain.name} roles
                        in TT — coming soon.
                      </p>
                      <div
                        style={{
                          fontSize: 11,
                          padding: "6px 14px",
                          borderRadius: 6,
                          background: activeDomain.color,
                          color: "#0A0E17",
                          fontWeight: 700,
                          display: "inline-block",
                          cursor: "pointer",
                        }}
                      >
                        Generate Resume →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
