import logo from "/assets/logo.png";

export default function Header() {
    return (
        <header
            className="w-full"
            style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.65))",
                paddingTop: "2.6rem",
                paddingBottom: "2.8rem",
                borderRadius: "0 0 20px 20px",   // Borda acompanha o topo inteiro
                boxShadow: "0 12px 32px rgba(92,46,9,0.15)",
                textAlign: "center",
            }}
        >

            {/* Ícone CMV Centralizado */}
            <img
                src={logo}
                alt="Logotipo da Comunidade Missionária de Villaregia"
                style={{
                    height: "70px",
                    width: "auto",
                    marginBottom: "1.2rem",
                    display: "block",
                    marginLeft: "auto",
                    marginRight: "auto",   // centralização real
                }}
            />

            {/* Título */}
            <div
                className="h-liturgico"
                style={{
                    fontSize: "3rem",
                    fontWeight: "700",
                    letterSpacing: "1.3px",
                    color: "var(--cmv-text)",
                    textTransform: "uppercase",
                    lineHeight: "1.18",
                }}
            >
                Planejador de Missas
            </div>
        </header>
    );
}
