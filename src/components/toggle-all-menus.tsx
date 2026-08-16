"use client";

/** Toggle semua checkbox menu akses pada form akun. */
export function ToggleAllMenus() {
  return (
    <button
      type="button"
      onClick={(e) => {
        const boxes = Array.from(
          document.querySelectorAll<HTMLInputElement>("input.menu-checkbox")
        );
        const allChecked = boxes.length > 0 && boxes.every((cb) => cb.checked);
        boxes.forEach((cb) => {
          cb.checked = !allChecked;
        });
        (e.currentTarget as HTMLButtonElement).innerText = allChecked
          ? "Check All"
          : "Uncheck All";
      }}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
    >
      Toggle All
    </button>
  );
}