// McMaster-branded header. Maroon (#7A003C) per McMaster brand guidelines.

export function Header() {
  return (
    <header className="bg-mcmaster-maroon text-white shadow">
      <div className="mx-auto flex max-w-3xl items-baseline gap-3 px-5 py-4">
        <h1 className="m-0 text-2xl font-semibold">WorkLog</h1>
        <span className="text-sm opacity-85">McMaster Facility Services</span>
      </div>
    </header>
  );
}
