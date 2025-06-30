export default function ImportPage() {
    return (<div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Import FDA Labels</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-4">
          Upload FDA label JSON files to import drug information into the system.
        </p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            Drag and drop FDA label JSON files here, or click to browse
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Select Files
          </button>
        </div>
      </div>
    </div>);
}
