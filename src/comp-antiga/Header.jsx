import logo from "/assets/logo.png";

/**
 * Header cerimonial
 * - Logo pequeno e centralizado
 * - Título grande e solene
 * - Espaçamento litúrgico
 * - Card com estética CMV
 */
export default function Header() {
    return (
        <header
            className="header-cmv cmv-border"
            role="banner"
            style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.6))",
                paddingTop: "2.2rem",
                paddingBottom: "2.6rem",
                borderRadius: "18px",
                boxShadow: "0 10px 28px rgba(92,46,9,0.09)",
                maxWidth: "720px",
                margin: "0 auto",
            }}
        >
            <img
                src={logo}
                alt="Logotipo da Comunidade Missionária de Villaregia"
                className="logo"
                style={{
                    height: "52px",
                    marginBottom: "0.8rem",
                }}
            />

            <div
                className="title h-liturgico"
                style={{
                    fontSize: "2.6rem",
                    fontWeight: 700,
                    lineHeight: "1.18",
                    letterSpacing: "1.2px",
                    color: "var(--cmv-text)",
                    textAlign: "center",
                    textTransform: "uppercase",
                }}
            >
                Planejador de Missas
            </div>
        </header>
    );
}
