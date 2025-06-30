export function DosageTable({ dosages }) {
    if (!dosages.length) {
        return (<section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Dosage & Administration</h2>
        <p className="text-gray-500">No dosage information available.</p>
      </section>);
    }
    return (<section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Dosage & Administration</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Condition</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Dosage</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Frequency</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Route</th>
            </tr>
          </thead>
          <tbody>
            {dosages.map((dosage, index) => (<tr key={index}>
                <td className="border border-gray-300 px-4 py-2">{dosage.condition}</td>
                <td className="border border-gray-300 px-4 py-2">{dosage.dosage}</td>
                <td className="border border-gray-300 px-4 py-2">{dosage.frequency}</td>
                <td className="border border-gray-300 px-4 py-2">{dosage.route}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </section>);
}
