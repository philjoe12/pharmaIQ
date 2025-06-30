export function IndicationsSection({ indications }) {
    if (!indications.length) {
        return (<section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Indications</h2>
        <p className="text-gray-500">No indications available.</p>
      </section>);
    }
    return (<section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Indications</h2>
      <div className="space-y-3">
        {indications.map((indication, index) => (<div key={index} className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-800">{indication}</p>
          </div>))}
      </div>
    </section>);
}
