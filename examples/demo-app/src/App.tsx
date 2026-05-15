import { useProviders, usePresets, useActiveSelection } from '@keysme-ai/react'
import { ProviderForm } from './components/ProviderForm'
import { ProviderCard } from './components/ProviderCard'
import { PresetForm } from './components/PresetForm'
import { PresetCard } from './components/PresetCard'
import { ActiveConfigView } from './components/ActiveConfigView'
import { ProxyToggle } from './components/ProxyToggle'
import { ExportImport } from './components/ExportImport'

export function App() {
  const { providers, removeProvider } = useProviders()
  const { presets, removePreset } = usePresets()
  const { active, setActive } = useActiveSelection()

  return (
    <div className="app">
      <header className="header">
        <h1>keysme-ai demo</h1>
        <div className="header-actions">
          <ExportImport />
          <ProxyToggle />
        </div>
      </header>

      <section>
        <h2>Providers</h2>
        <ProviderForm />
        {providers.map((p) => (
          <ProviderCard key={p.id} provider={p} onRemove={() => removeProvider(p.id)} />
        ))}
        {providers.length === 0 && (
          <p className="hint">No providers yet. Pick one above to get started.</p>
        )}
      </section>

      <section>
        <h2>Presets</h2>
        <PresetForm />
        {presets.map((p) => (
          <PresetCard
            key={p.id}
            preset={p}
            isActive={active?.presetId === p.id}
            onSetActive={() => setActive({ presetId: p.id })}
            onRemove={() => removePreset(p.id)}
          />
        ))}
        {presets.length === 0 && providers.length > 0 && (
          <p className="hint">Add a preset to configure a model.</p>
        )}
      </section>

      {active && <ActiveConfigView presetId={active.presetId} />}

      <footer className="footer">
        Direct browser requests (connection test, model fetching) usually fail due to CORS.
        In production, route LLM calls through a server proxy.
      </footer>
    </div>
  )
}
