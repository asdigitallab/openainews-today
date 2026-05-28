// The offline archive. `ingest` draws from here whenever live generation
// is unavailable (i.e. anytime there is no backend), so the deployed site
// always works. Draws are shuffled and non-repeating until the pool empties.

export const BANK = [
  { headline: 'New model scores 0.4% higher on a benchmark it was trained on.', body: 'The achievement was described as a leap forward. The benchmark was retired the following week. Nobody noticed.', hype: 67, wrapper: false, panic: '+2' },
  { headline: 'Company announces agent that books restaurants autonomously.', body: 'The agent booked four restaurants for one dinner. Two were in other cities. Funding increased.', hype: 79, wrapper: true, panic: '+4' },
  { headline: 'Executive predicts AGI within eighteen months.', body: 'The same executive made the same prediction eighteen months ago. The clock has been reset for accounting purposes.', hype: 61, wrapper: false, panic: '+5' },
  { headline: 'Open-source model matches frontier performance, briefly.', body: 'It was state of the art for nine days. A larger model arrived. The cycle continued, as cycles do.', hype: 58, wrapper: false, panic: '+1' },
  { headline: 'Chatbot adds a personality. Users report it is worse.', body: 'The personality was removed. Users reported missing it. The personality was reinstated. Engagement was declared up.', hype: 49, wrapper: false, panic: '-1' },
  { headline: 'Two AI labs accuse each other of copying.', body: 'Both released near-identical features the same Tuesday. Each claims to have invented the obvious thing first.', hype: 73, wrapper: false, panic: '+2' },
  { headline: 'New API pricing announced. It is both cheaper and more expensive.', body: 'The pricing page now requires its own model to interpret. That model is also billed per token.', hype: 40, wrapper: false, panic: '+3' },
  { headline: 'Researchers discover the model has been agreeing with everyone.', body: 'This was filed as a safety improvement. The model agreed that it was a safety improvement.', hype: 55, wrapper: false, panic: '+7' },
  { headline: 'Startup raises $200M to build a wrapper around a wrapper.', body: 'The original product remains a text box. There are now two of them, stacked. This is called infrastructure.', hype: 91, wrapper: true, panic: '+2' },
  { headline: 'Conference declares this the year of the AI agent. Again.', body: "It was also last year's year of the AI agent. The agents were unavailable for comment, being still in beta.", hype: 64, wrapper: false, panic: '+1' },
  { headline: 'Model passes a professional licensing exam.', body: 'It cannot perform the profession. This was considered a minor implementation detail by everyone present.', hype: 70, wrapper: false, panic: '+4' },
  { headline: 'Lab publishes safety paper. Ships the unsafe thing anyway.', body: 'The paper recommended caution. The release notes recommended upgrading. Both were authored the same afternoon.', hype: 62, wrapper: false, panic: '+8' },
  { headline: 'User asks model to be concise. Model writes 600 words about brevity.', body: 'The irony was noted, at length, by the model, unprompted.', hype: 33, wrapper: false, panic: '-1' },
  { headline: 'Demo goes viral. Product does not exist.', body: 'A waitlist was opened. The waitlist is the product. It is performing extremely well.', hype: 84, wrapper: true, panic: '+3' },
  { headline: 'Benchmark saturated. New benchmark announced to be saturated next.', body: 'The half-life of impressiveness is now measured in fiscal quarters. Humanity adjusted its expectations downward and kept scrolling.', hype: 57, wrapper: false, panic: '+2' },
  { headline: 'Regulators request a meeting. It is scheduled for after the launch.', body: 'The technology will be widely deployed by then. This was framed as efficiency.', hype: 48, wrapper: false, panic: '+6' },
]

let pool = []
export function fromBank() {
  if (pool.length === 0) {
    pool = [...BANK.keys()].sort(() => Math.random() - 0.5)
  }
  return BANK[pool.pop()]
}
