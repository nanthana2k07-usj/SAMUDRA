import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CaseStudyPoint, DepthBandMetric, OceanStateProduct, UncertaintyMetric, ValidationMetric } from '../types/ocean'

export function ValidationChart({ data }: { data: ValidationMetric[] }) {
  return (
    <div className="scientific-chart-shell" style={{ width: '100%', height: 280 }} role="img" aria-label="Horizontal bar chart comparing held-out GLORYS12 test RMSE for climatology and four model configurations">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 12, right: 38, bottom: 12, left: 16 }}
          barSize={20}
        >
          <CartesianGrid stroke="#CBD5E1" strokeDasharray="3 3" horizontal={false} strokeOpacity={0.6} />
          <XAxis
            type="number"
            domain={[0, 1.05]}
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#94A3B8' }}
            label={{
              value: 'RMSE (°C) · Lower is Better',
              position: 'insideBottom',
              offset: -4,
              fill: '#12304A',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <YAxis
            type="category"
            dataKey="model"
            width={185}
            tick={{ fill: '#12304A', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#94A3B8' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(23, 107, 154, 0.08)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as ValidationMetric
              return (
                <div className="scientific-chart-tooltip">
                  <strong>{row.model}</strong>
                  <span className="text-teal font-semibold">{row.rmse.toFixed(6)} °C RMSE</span>
                  <span className="text-slate">{row.note}</span>
                </div>
              )
            }}
          />
          <Bar dataKey="rmse" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((entry) => {
              const isMain = entry.model.includes('Cyclone')
              const fill = isMain
                ? '#138A8A'
                : entry.model.includes('Climatology')
                  ? '#64748B'
                  : entry.model.includes('U-Net')
                    ? '#176B9A'
                    : '#0D9488'
              return <Cell key={entry.model} fill={fill} />
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DepthBandChart({ data }: { data: DepthBandMetric[] }) {
  return (
    <div className="scientific-chart-shell" style={{ width: '100%', height: 280 }} role="img" aria-label="ARGO test-day temperature RMSE by depth band, mean and sample standard deviation over three SAMUDRA-Cyclone seeds">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 34, bottom: 12, left: 12 }}
          barSize={18}
        >
          <CartesianGrid stroke="#CBD5E1" strokeDasharray="3 3" horizontal={false} strokeOpacity={0.6} />
          <XAxis
            type="number"
            domain={[0, 2.2]}
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#94A3B8' }}
            unit="°C"
            label={{
              value: 'ARGO Test-Day RMSE (°C) · Lower is Better',
              position: 'insideBottom',
              offset: -4,
              fill: '#12304A',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <YAxis
            type="category"
            dataKey="band"
            width={84}
            tick={{ fill: '#12304A', fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: '#94A3B8' }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(19, 138, 138, 0.08)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as DepthBandMetric
              return (
                <div className="scientific-chart-tooltip">
                  <strong>Depth Band: {row.band}</strong>
                  <span className="text-teal font-semibold">
                    {row.rmse.toFixed(3)} ± {row.spread.toFixed(3)} °C RMSE
                  </span>
                  <span className="text-slate">{row.points} matched in-situ points per seed</span>
                </div>
              )
            }}
          />
          <Bar dataKey="rmse" fill="#138A8A" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <ErrorBar dataKey="spread" direction="x" width={4} stroke="#0D6E6E" strokeWidth={1.5} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function UncertaintyChart({ data }: { data: UncertaintyMetric[] }) {
  const plotted = data.map((row) => ({
    ...row,
    nominalFraction: row.nominal / 100,
  }))

  return (
    <div className="scientific-chart-shell" style={{ width: '100%', height: 310 }} role="img" aria-label="Calibrated empirical coverage compared across GLORYS test, ARGO model sigma only, and ARGO with representativeness error">
      <ResponsiveContainer width="100%" height={310}>
        <LineChart data={plotted} margin={{ top: 16, right: 24, bottom: 20, left: 12 }}>
          <CartesianGrid stroke="#CBD5E1" strokeDasharray="3 3" strokeOpacity={0.65} />
          <XAxis
            dataKey="nominal"
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#94A3B8' }}
            label={{
              value: 'Nominal Confidence Level (%)',
              position: 'insideBottom',
              offset: -10,
              fill: '#12304A',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <YAxis
            domain={[0.35, 1]}
            tickFormatter={(value) => `${Math.round(value * 100)}%`}
            tick={{ fill: '#475569', fontSize: 11 }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#94A3B8' }}
            width={48}
            label={{
              value: 'Empirical Coverage (%)',
              angle: -90,
              position: 'insideLeft',
              offset: 8,
              fill: '#12304A',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <ReferenceLine
            segment={[
              { x: 50, y: 0.5 },
              { x: 95, y: 0.95 },
            ]}
            stroke="#94A3B8"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: 'Ideal 1:1 Calibration',
              position: 'insideTopLeft',
              fill: '#64748B',
              fontSize: 10,
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as UncertaintyMetric
              return (
                <div className="scientific-chart-tooltip">
                  <strong>Nominal {row.nominal}% Confidence Interval</strong>
                  <div className="tooltip-row text-teal">
                    <span>GLORYS12 Test:</span>
                    <strong>{(row.glorys * 100).toFixed(2)}%</strong>
                  </div>
                  <div className="tooltip-row text-ocean">
                    <span>ARGO (Model σ):</span>
                    <strong>{(row.argoSigma * 100).toFixed(2)}%</strong>
                  </div>
                  <div className="tooltip-row text-purple">
                    <span>ARGO (+ Representativeness):</span>
                    <strong>{(row.argoRepresentativeness * 100).toFixed(2)}%</strong>
                  </div>
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="glorys"
            name="GLORYS12 Test"
            stroke="#138A8A"
            strokeWidth={2.4}
            dot={{ r: 4, fill: '#138A8A' }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="argoSigma"
            name="ARGO (Model σ Only)"
            stroke="#176B9A"
            strokeWidth={2.2}
            dot={{ r: 4, fill: '#176B9A' }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="argoRepresentativeness"
            name="ARGO (+ Representativeness)"
            stroke="#7C3AED"
            strokeWidth={2.2}
            dot={{ r: 4, fill: '#7C3AED' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function caseValue(row: CaseStudyPoint, key: keyof CaseStudyPoint | null): number | null {
  if (!key || key === 'date') return null
  const value = row[key]
  return typeof value === 'number' ? value : null
}

export function CaseStudyChart({
  data,
  product,
}: {
  data: CaseStudyPoint[]
  product: OceanStateProduct
}) {
  const chartData = data.map((row) => ({
    date: row.date.slice(5),
    reference: caseValue(row, product.referenceKey),
    estimate: caseValue(row, product.estimateKey),
    spread: caseValue(row, product.spreadKey),
    observed: caseValue(row, product.key === 'sst' ? 'SST_satellite' : null),
  }))

  const showObservedOnly = product.key === 'sst'

  return (
    <div className="scientific-chart-shell" style={{ width: '100%', height: 320 }} role="img" aria-label={`${product.label} case-study time series from July 18 through August 15, 2023`}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 20, left: 10 }}>
          <CartesianGrid stroke="#CBD5E1" strokeDasharray="3 3" strokeOpacity={0.65} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#475569', fontSize: 10 }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#94A3B8' }}
            interval={3}
            label={{
              value: 'Date (2023)',
              position: 'insideBottom',
              offset: -10,
              fill: '#12304A',
              fontSize: 11,
              fontWeight: 600,
            }}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 10 }}
            tickLine={{ stroke: '#CBD5E1' }}
            axisLine={{ stroke: '#94A3B8' }}
            width={48}
            unit={product.unit.startsWith('°') ? '°C' : ''}
          />
          <Tooltip
            labelFormatter={(value) => `2023-${String(value)}`}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload
              return (
                <div className="scientific-chart-tooltip">
                  <strong>Date: 2023-{row.date}</strong>
                  {showObservedOnly ? (
                    <div className="tooltip-row text-teal">
                      <span>Satellite SST:</span>
                      <strong>{row.observed?.toFixed(2)} °C</strong>
                    </div>
                  ) : (
                    <>
                      <div className="tooltip-row text-amber">
                        <span>GLORYS12:</span>
                        <strong>{row.reference?.toFixed(2)} {product.unit}</strong>
                      </div>
                      <div className="tooltip-row text-teal">
                        <span>SAMUDRA:</span>
                        <strong>{row.estimate?.toFixed(2)} {product.unit}</strong>
                      </div>
                      {row.spread !== null && (
                        <div className="tooltip-row text-slate">
                          <span>3-Seed Spread:</span>
                          <strong>± {row.spread?.toFixed(2)} {product.unit}</strong>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            }}
          />
          {showObservedOnly ? (
            <Line
              type="monotone"
              dataKey="observed"
              name="Satellite SST"
              stroke="#138A8A"
              strokeWidth={2.4}
              dot={{ r: 2.5, fill: '#138A8A' }}
              isAnimationActive={false}
            />
          ) : (
            <>
              <Line
                type="monotone"
                dataKey="reference"
                name="GLORYS12 Reference Target"
                stroke="#D97706"
                strokeWidth={2.0}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#D97706' }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="estimate"
                name="SAMUDRA Reconstruction"
                stroke="#138A8A"
                strokeWidth={2.4}
                dot={{ r: 3, fill: '#138A8A' }}
                isAnimationActive={false}
              >
                <ErrorBar dataKey="spread" direction="y" width={3} stroke="#0D6E6E" strokeOpacity={0.8} />
              </Line>
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
