 export default function More() {
  return (
    <>
      <div className="pt-0 pb-2 mb-3">
        <h2>Responsive Content Area</h2>
        <p>
          This is the main content section. On smaller screens, click the menu
          button to toggle the sidebar.
        </p>

        <div className="row">
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Card 1</h5>
                <p className="card-text">Some example text for card 1.</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Card 2</h5>
                <p className="card-text">Some example text for card 2.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
