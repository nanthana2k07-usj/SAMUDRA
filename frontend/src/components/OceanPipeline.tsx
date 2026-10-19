import { ArrowDown, ArrowRight, Layers3, Satellite, Waves, Wind } from 'lucide-react'

export function OceanPipeline() {
  return (
    <div className="pipeline" aria-label="Surface observations flow into SAMUDRA, which reconstructs subsurface ocean intelligence">
      <article className="pipeline-step">
        <span className="pipeline-step__number">01</span>
        <span className="pipeline-step__icon"><Satellite size={21} /></span>
        <strong>OBSERVE</strong>
        <p>Surface ocean and atmospheric observations</p>
        <div className="pipeline-step__tags"><span>SST</span><span>SSS</span><span>SSH</span><span>WIND</span></div>
      </article>
      <span className="pipeline-arrow" aria-hidden="true"><ArrowRight /></span>
      <article className="pipeline-step pipeline-step--featured">
        <span className="pipeline-step__number">02</span>
        <span className="pipeline-step__icon"><Waves size={21} /></span>
        <strong>RECONSTRUCT</strong>
        <p>SAMUDRA hybrid neural network</p>
        <div className="pipeline-step__tags"><span>FNO</span><span>ViT</span><span>U-NET</span></div>
      </article>
      <span className="pipeline-arrow" aria-hidden="true"><ArrowRight /></span>
      <article className="pipeline-step">
        <span className="pipeline-step__number">03</span>
        <span className="pipeline-step__icon"><Layers3 size={21} /></span>
        <strong>UNDERSTAND</strong>
        <p>Temperature structure + derived ocean products</p>
        <div className="pipeline-step__tags"><span>35 LEVELS</span><span>D26</span><span>TCHP</span></div>
      </article>
      <div className="pipeline-mobile-arrow" aria-hidden="true"><ArrowDown /></div>
      <div className="pipeline-caption"><Wind size={14} /> Surface signals carry clues about the water column below.</div>
    </div>
  )
}
