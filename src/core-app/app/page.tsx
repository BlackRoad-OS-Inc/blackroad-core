export default function Home() {
  const serviceName = process.env.SERVICE_NAME || 'blackroad-service'
  const serviceEnv = process.env.SERVICE_ENV || 'development'
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'BlackRoad Service'

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        padding: '2rem',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {appName}
        </h1>

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          fontSize: '0.875rem'
        }}>
          <span style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            border: '1px solid #444'
          }}>
            {serviceName}
          </span>
          <span style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: serviceEnv === 'production' ? '#1a472a' : '#2a2a2a',
            borderRadius: '4px',
            border: `1px solid ${serviceEnv === 'production' ? '#2d5f3d' : '#444'}`
          }}>
            {serviceEnv}
          </span>
        </div>

        <p style={{
          fontSize: '1.125rem',
          lineHeight: '1.75',
          marginBottom: '2rem',
          color: '#b0b0b0'
        }}>
          BlackRoad infrastructure service endpoint. This service is part of the BlackRoad ecosystem.
        </p>

        <div style={{
          display: 'grid',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            marginBottom: '0.5rem',
            color: '#e0e0e0'
          }}>
            Service Endpoints
          </h2>

          <a
            href="/api/health"
            style={{
              display: 'block',
              padding: '1rem',
              backgroundColor: '#2a2a2a',
              borderRadius: '6px',
              border: '1px solid #444',
              textDecoration: 'none',
              color: '#667eea',
              transition: 'all 0.2s'
            }}
          >
            <strong>/api/health</strong>
            <span style={{ color: '#888', marginLeft: '1rem' }}>→ Health check endpoint</span>
          </a>

          <a
            href="/api/version"
            style={{
              display: 'block',
              padding: '1rem',
              backgroundColor: '#2a2a2a',
              borderRadius: '6px',
              border: '1px solid #444',
              textDecoration: 'none',
              color: '#667eea',
              transition: 'all 0.2s'
            }}
          >
            <strong>/api/version</strong>
            <span style={{ color: '#888', marginLeft: '1rem' }}>→ Version information</span>
          </a>

          <a
            href="/api/ready"
            style={{
              display: 'block',
              padding: '1rem',
              backgroundColor: '#2a2a2a',
              borderRadius: '6px',
              border: '1px solid #444',
              textDecoration: 'none',
              color: '#667eea',
              transition: 'all 0.2s'
            }}
          >
            <strong>/api/ready</strong>
            <span style={{ color: '#888', marginLeft: '1rem' }}>→ Readiness probe</span>
          </a>
        </div>

        <footer style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #333',
          fontSize: '0.875rem',
          color: '#666',
          textAlign: 'center'
        }}>
          BlackRoad Infrastructure · {new Date().getFullYear()}
        </footer>
      </div>
    </main>
  )
}
