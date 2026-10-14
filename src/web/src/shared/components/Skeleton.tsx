import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

function Skeleton({ width, height = 14, borderRadius, className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius, ...style }}
    />
  )
}

function Circle({ size = 34, className = '', style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return <Skeleton width={size} height={size} borderRadius="50%" className={`skeleton-circle ${className}`} style={style} />
}

function Card({ rows = 3, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`skeleton-card ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton
          key={i}
          width={i === rows - 1 ? '60%' : '100%'}
          height={14}
          style={{ marginBottom: i < rows - 1 ? '0.625rem' : 0 }}
        />
      ))}
    </div>
  )
}

function Table({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <table className={`skeleton-table ${className}`}>
      <thead>
        <tr>
          {Array.from({ length: cols }, (_, i) => (
            <th key={i}><Skeleton width="60%" height={12} /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }, (_, c) => (
              <td key={c}><Skeleton width={c === 0 ? '40%' : '80%'} height={14} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default Object.assign(Skeleton, { Circle, Card, Table })
