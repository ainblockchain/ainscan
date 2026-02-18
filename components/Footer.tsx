export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            AINscan — AI Network Blockchain Explorer
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a
              href="https://ainetwork.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700"
            >
              AI Network
            </a>
            <a
              href="https://github.com/ainblockchain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
