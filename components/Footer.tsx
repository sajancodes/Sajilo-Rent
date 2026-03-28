import React from 'react';
import { InstagramIcon, FacebookIcon, TwitterIcon, WhatsAppIcon } from './icons/Icons';

interface FooterProps {
    onOpenLegalModal: (type: 'terms' | 'privacy') => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenLegalModal }) => {
    return (
        <footer className="bg-gray-800 text-white">
            <div className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Column 1: Brand & Social */}
                    <div>
                        <a href="/" className="flex items-center gap-2">
                            <img src="https://iili.io/qNyNLKJ.md.png" alt="Sajilo Rent logo" className="h-9 w-9 rounded-full object-cover" />
                            <span className="text-2xl font-bold">Sajilo Rent</span>
                        </a>
                        <p className="mt-4 text-gray-400 text-sm">
                            Find trusted rooms & flatmates near you. Local listings, contact owners directly, and find rooms quickly.
                        </p>
                        <div className="flex space-x-4 mt-6">
                            <a href="#" className="text-gray-400 hover:text-white" aria-label="Facebook"><FacebookIcon /></a>
                            <a href="#" className="text-gray-400 hover:text-white" aria-label="Twitter"><TwitterIcon /></a>
                            <a href="https://www.instagram.com/troomzone/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white" aria-label="Instagram"><InstagramIcon /></a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="font-semibold tracking-wide">Quick Links</h3>
                        <ul className="mt-4 space-y-2">
                            <li><a href="/" className="text-gray-400 hover:text-white text-sm">Home</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white text-sm">About Us</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white text-sm">Contact</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white text-sm">Post a Room</a></li>
                            <li><button onClick={() => onOpenLegalModal('terms')} className="text-gray-400 hover:text-white text-sm">Terms & Privacy</button></li>
                        </ul>
                    </div>

                    {/* Column 3: Contact */}
                    <div>
                        <h3 className="font-semibold tracking-wide">Contact</h3>
                        <ul className="mt-4 space-y-3 text-sm">
                            <li className="text-gray-400">Need help? Reach out —</li>
                            <li><a href="mailto:troomzone@gmail.com" className="text-gray-400 hover:text-white">Email: troomzone@gmail.com</a></li>
                            <li><a href="tel:+9779864393383" className="text-gray-400 hover:text-white">Phone: +977 9864393383</a></li>
                            <li><a href="https://wa.me/9779864393383" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
                                <WhatsAppIcon className="h-5 w-5"/> WhatsApp
                            </a></li>
                        </ul>
                    </div>
                    
                    {/* Column 4: Newsletter */}
                    <div>
                        <h3 className="font-semibold tracking-wide">Stay updated</h3>
                        <p className="mt-4 text-gray-400 text-sm">Get latest listings & offers in your inbox.</p>
                        <form className="mt-4 flex">
                            <input type="email" placeholder="Your email" aria-label="Your email" className="w-full px-4 py-2 text-gray-800 bg-white border border-transparent rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <button type="submit" className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-700 pt-4 flex flex-col sm:flex-row justify-between items-center text-sm">
                    <p className="text-gray-500">&copy; {new Date().getFullYear()} Sajilo Rent. All rights reserved.</p>
                    <p className="text-gray-500 mt-4 sm:mt-0">Made with ❤️ by Vishal</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;