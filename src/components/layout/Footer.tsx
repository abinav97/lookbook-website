export default function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="px-[var(--page-margin)] py-12 md:py-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex flex-col gap-2">
          <span className="font-serif text-sm tracking-[0.25em] font-light text-text">
            ABI&apos;S LOOKBOOK
          </span>
          <span className="text-[10px] tracking-[0.15em] text-text-muted">
            A LIVING PORTFOLIO
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-10 text-[11px] tracking-[0.15em] text-text-muted">
          <a href="mailto:abinav@wharton.upenn.edu" className="hover:text-text transition-colors duration-300">
            CONTACT
          </a>
          <a href="https://www.linkedin.com/in/abinav-bharadwaj/" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors duration-300">
            LINKEDIN
          </a>
        </div>
      </div>

      <div className="px-[var(--page-margin)] pb-8">
        <div className="h-px bg-border mb-6" />
        <p className="text-[10px] tracking-[0.1em] text-text-muted">
          &copy; {new Date().getFullYear()} ABI&apos;S LOOKBOOK. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
