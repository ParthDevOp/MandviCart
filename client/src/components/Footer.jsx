import { assets, footerLinks } from "../assets/assets";

const Footer = () => {

    return (
        <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-24 bg-primary/10">
            <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/30 text-gray-500">
                
                {/* Brand Section */}
                <div className="w-full md:w-1/3">
                    <img className="w-32 mb-4" src={assets.logo} alt="Mandvi Cart Logo" />
                    <p className="max-w-[410px] text-sm leading-6">
                        We deliver fresh groceries and snacks straight to your door. Trusted by thousands, we aim to make your shopping experience simple and affordable.
                    </p>
                </div>

                {/* Footer Links (Dynamic) */}
                <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
                    {footerLinks.map((section, index) => (
                        <div key={index}>
                            <h3 className="font-semibold text-base text-gray-900 md:mb-5 mb-2">{section.title}</h3>
                            <ul className="text-sm space-y-2">
                                {section.links.map((link, i) => (
                                    <li key={i}>
                                        <a href={link.url} className="hover:text-primary transition">{link.text}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Contact Info (Manually Added) */}
                    <div>
                        <h3 className="font-semibold text-base text-gray-900 md:mb-5 mb-2">Contact Us</h3>
                        <ul className="text-sm space-y-2">
                            <li>+91 7878787565</li>
                            <li>contact@mandvicart.com</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <p className="py-4 text-center text-sm md:text-base text-gray-500/80">
                Copyright {new Date().getFullYear()} © Mandvi Cart. All Rights Reserved.
            </p>
        </div>
    );
};

export default Footer;