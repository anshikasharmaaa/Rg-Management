import Header from "../shared/Header.jsx";
import Hero from "../../components/public/Hero.jsx";
import MenuPreview from "../../components/public/MenuPreview.jsx";
import Footer from "../../components/public/Footer.jsx";

const Home = () => {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <Hero />
            <MenuPreview limit={6} />
            <Footer />
        </div>
    );
};

export default Home;
