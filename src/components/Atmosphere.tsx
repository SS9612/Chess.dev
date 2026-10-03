import './Atmosphere.css'

/** Fixed backdrop. Sits behind the page and does not receive clicks. */
export function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <span className="haze haze-sun" />
      <span className="haze haze-ocean" />
      <span className="haze haze-palm" />
      <span className="specks" />
    </div>
  )
}
