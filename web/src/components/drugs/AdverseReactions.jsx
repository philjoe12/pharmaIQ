export function AdverseReactions({ reactions }) {
    if (!reactions.length) {
        return (<section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Adverse Reactions</h2>
        <p className="text-gray-500">No adverse reactions data available.</p>
      </section>);
    }
    const getSeverityBadge = (severity) => {
        const colors = {
            mild: 'bg-green-100 text-green-800',
            moderate: 'bg-yellow-100 text-yellow-800',
            severe: 'bg-red-100 text-red-800',
        };
        return colors[severity] || 'bg-gray-100 text-gray-800';
    };
    return (<section className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">Adverse Reactions</h2>
      <div className="grid gap-3">
        {reactions.map((reaction, index) => (<div key={index} className="flex justify-between items-center p-3 border rounded-lg">
            <div>
              <span className="font-medium">{reaction.name}</span>
              <span className="text-gray-500 ml-2">({reaction.frequency})</span>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadge(reaction.severity)}`}>
              {reaction.severity}
            </span>
          </div>))}
      </div>
    </section>);
}
