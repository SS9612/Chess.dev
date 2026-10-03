import './Atmosphere.css'

/** Fixed backdrop. Sits behind the page and does not receive clicks. */
export function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <span className="haze haze-magenta" />
      <span className="haze haze-violet" />
      <span className="haze haze-cyan" />
      <span className="specks" />
    </div>
  )
}
