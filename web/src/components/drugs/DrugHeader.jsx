export function DrugHeader({ name, genericName, manufacturer, drugClass }) {
    return (<div className="border-b pb-6 mb-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">{name}</h1>
      {genericName && (<p className="text-xl text-gray-600 mb-2">Generic: {genericName}</p>)}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
        <span>Manufacturer: {manufacturer}</span>
        {drugClass && <span>Drug Class: {drugClass}</span>}
      </div>
    </div>);
}
