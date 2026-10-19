import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { argoScatterPoints, argoStats } from '../data/argoData'
import type { ArgoPoint } from '../types/ocean'

export function ArgoScatterPlot() {
  return (
    <div className="argo-scatter-card">
      <div className="argo-card-topline">
        <div>
          <span className="gov-section-eyebrow">INDEPENDENT POINTWISE AGREEMENT</span>
          <h3 className="argo-card-title">ARGO In-Situ Observed vs SAMUDRA Reconstructed</h3>
          <p className="argo-card-sub">
            Pointwise temperature comparison (°C) on held-out test days across 35 depth levels. Solid line indicates 1:1 perfect physical agreement.
          </p>
        </div>

        <div className="argo-stats-pill-group">
          <span className="argo-stat-chip">
            R² = <strong>{argoStats.rSquared}</strong>
          </span>
          <span className="argo-stat-chip">
            r = <strong>{argoStats.correlation}</strong>
          </span>
          <span className="argo-stat-chip argo-stat-chip--primary">
            Best Checkpoint RMSE = <strong>{argoStats.bestSeedRmse} °C</strong>
          </span>
        </div>
      </div>

      <div className="scientific-chart-shell" style={{ width: '100%', height: 340 }} role="img" aria-label="Scatter plot of ARGO observed temperature vs SAMUDRA reconstructed temperature with 1:1 line">
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 16 }}>
            <CartesianGrid stroke="#CBD5E1" strokeDasharray="3 3" strokeOpacity={0.65} />
            <XAxis
              type="number"
              dataKey="observed"
              name="ARGO Observed"
              unit="°C"
              domain={[4, 31]}
              tick={{ fill: '#475569', fontSize: 11 }}
              tickLine={{ stroke: '#CBD5E1' }}
              axisLine={{ stroke: '#94A3B8' }}
              label={{
                value: 'In-Situ ARGO Observed Temperature (°C)',
                position: 'insideBottom',
                offset: -12,
                fill: '#12304A',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            <YAxis
              type="number"
              dataKey="reconstructed"
              name="SAMUDRA"
              unit="°C"
              domain={[4, 31]}
              tick={{ fill: '#475569', fontSize: 11 }}
              tickLine={{ stroke: '#CBD5E1' }}
              axisLine={{ stroke: '#94A3B8' }}
              width={54}
              label={{
                value: 'SAMUDRA Reconstructed (°C)',
                angle: -90,
                position: 'insideLeft',
                offset: 8,
                fill: '#12304A',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#138A8A' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload as ArgoPoint
                const diff = (data.reconstructed - data.observed).toFixed(2)
                const sign = Number(diff) >= 0 ? '+' : ''
                return (
                  <div className="scientific-chart-tooltip">
                    <strong>ARGO Profile {data.id}</strong>
                    <div className="tooltip-row text-slate">
                      <span>Date & Depth:</span>
                      <strong>{data.date} · {data.depth} m</strong>
                    </div>
                    <div className="tooltip-row text-ocean">
                      <span>ARGO In-Situ Observed:</span>
                      <strong>{data.observed} °C</strong>
                    </div>
                    <div className="tooltip-row text-teal">
                      <span>SAMUDRA Reconstructed:</span>
                      <strong>{data.reconstructed} °C</strong>
                    </div>
                    <div className="tooltip-row text-navy">
                      <span>Residual (O - P):</span>
                      <strong>{sign}{diff} °C</strong>
                    </div>
                  </div>
                )
              }}
            />
            <ReferenceLine
              segment={[{ x: 4, y: 4 }, { x: 31, y: 31 }]}
              stroke="#176B9A"
              strokeDasharray="4 4"
              strokeWidth={1.8}
              label={{
                value: '1:1 Agreement',
                position: 'insideTopLeft',
                fill: '#176B9A',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            <Scatter
              name="Matched ARGO Float Profiles"
              data={argoScatterPoints}
              fill="#138A8A"
              fillOpacity={0.82}
              stroke="#0D6E6E"
              strokeWidth={1}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="argo-summary-facts-grid">
        <div className="argo-fact-box">
          <span className="fact-label">BEST SEED TEST RMSE</span>
          <strong className="fact-val text-teal">0.753 °C</strong>
          <small className="fact-sub">Seed 0 test-day profiles (3-seed mean: 0.910 °C)</small>
        </div>
        <div className="argo-fact-box">
          <span className="fact-label">MEAN ABSOLUTE ERROR</span>
          <strong className="fact-val text-ocean">0.479 °C</strong>
          <small className="fact-sub">Average pointwise absolute deviation</small>
        </div>
        <div className="argo-fact-box">
          <span className="fact-label">SYSTEMATIC BIAS</span>
          <strong className="fact-val text-slate">+0.082 °C</strong>
          <small className="fact-sub">Slight warm bias relative to in-situ floats</small>
        </div>
        <div className="argo-fact-box">
          <span className="fact-label">PEARSON CORRELATION</span>
          <strong className="fact-val text-navy">r = 0.995</strong>
          <small className="fact-sub">Strong linear correlation across depth column</small>
        </div>
      </div>
    </div>
  )
}
