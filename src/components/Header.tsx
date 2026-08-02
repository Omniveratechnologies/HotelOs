export function Header() {
   const tabs = [
      { label: "Room 204", sub: "GUEST TABLET", active: false },
      { label: "Kitchen", sub: "KITCHEN DISPLAY", active: false },
      { label: "Reception", sub: "FRONT DESK", active: true },
   ];

   return (
      <header className="site-header">
         <div className="header-brand">
            <div className="header-logo">S</div>
            <div>
               <span className="header-brand-name">SuiteOS</span>
               <span className="header-brand-sub">
                  Live demo — actions on one screen sync to the others
               </span>
            </div>
         </div>

         <nav className="header-nav">
            {tabs.map((tab) => (
               <div
                  key={tab.sub}
                  className={`nav-tab${tab.active ? " active" : ""}`}
               >
                  <span className="nav-tab-label">{tab.label}</span>
                  <span className="nav-tab-sub">{tab.sub}</span>
               </div>
            ))}
         </nav>
      </header>
   );
}
