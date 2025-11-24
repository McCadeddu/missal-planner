import logo from "/assets/logo.png";

/**
 * Header litúrgico CMV
 * - Logo pequeno
 * - Título cerimonial
 * - Cores e estética da Comunidade Missionária de Villaregia
 */
export default function Header() {
    return (
        <header
            className="header-cmv cmv-border"
            role="banner"
            style={{
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
                paddingTop: "2rem",
                paddingBottom: "2.4rem",
                borderRadius: "20px",
                boxShadow: "0 10px 28px rgba(92,46,9,0.1)",
                maxWidth: "720px",
                margin: "0 auto",
            }}
        >
            <img
                src={logo}
                alt="Logotipo da Comunidade Missionária de Villaregia"
                style={{
                    height: "50px",
                    marginBottom: "0.8rem",
                }}
            />

            <div
                className="h-liturgico"
                style={{
                    fontSize: "2.4rem",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textAlign: "center",
                    color: "var(--cmv-text)",
                    textTransform: "uppercase",
                }}
            >
                Planejador de Missas
            </div>
        </header>
    );
}
