import { FC, useState } from "react";
import Button from "../../components/ui/button/Button";

interface User {
    name: string;
    role: string;
    createdAt: string;
    status: "Generated" | "Not Generated";
    avatar: string;
}

const users: User[] = [
    {
        name: "Vera Carpenter",
        role: "Admin",
        createdAt: "Jan 21, 2020",
        status: "Generated",
        avatar:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80",
    },
    {
        name: "Blake Bowman",
        role: "Editor",
        createdAt: "Jan 01, 2020",
        status: "Generated",
        avatar:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80",
    },
    {
        name: "Dana Moore",
        role: "Editor",
        createdAt: "Jan 10, 2020",
        status: "Not Generated",
        avatar:
            "https://images.unsplash.com/photo-1540845511934-7721dd7adec3?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2.2&w=160&h=160&q=80",
    },
    {
        name: "Alonzo Cox",
        role: "Admin",
        createdAt: "Jan 18, 2020",
        status: "Not Generated",
        avatar:
            "https://images.unsplash.com/photo-1522609925277-66fea332c575?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2.2&h=160&w=160&q=80",
    },
    {
        name: "John Doe",
        role: "User",
        createdAt: "Feb 12, 2020",
        status: "Generated",
        avatar:
            "https://randomuser.me/api/portraits/men/11.jpg",
    },
    {
        name: "Jane Smith",
        role: "Manager",
        createdAt: "Feb 18, 2020",
        status: "Not Generated",
        avatar:
            "https://randomuser.me/api/portraits/women/44.jpg",
    }
];

const statusColorMap: Record<User["status"], string> = {
    Generated: "text-green-900 bg-green-200",
    "Not Generated": "text-red-900 bg-red-200",
};

const TokenStatus: FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3; // Change this to show more/less rows per page

    const totalPages = Math.ceil(users.length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    return (
        <div>
            <div className="container mx-auto px-4 sm:px-8">
                <div className="py-8">
                    <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
                        <div className="inline-block min-w-full shadow overflow-hidden">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr>
                                        <th className="px-5 py-3 border border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-5 py-3 border border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Created at
                                        </th>
                                        <th className="px-5 py-3 border border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((user, idx) => (
                                        <tr key={idx}>
                                            <td className="px-5 py-2 border border-gray-200 bg-white text-sm">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 w-10 h-10">
                                                        <img
                                                            className="w-full h-full rounded-full"
                                                            src={user.avatar}
                                                            alt={user.name}
                                                        />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-gray-900 whitespace-no-wrap">
                                                            {user.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-2 border border-gray-200 bg-white text-sm">
                                                <p className="text-gray-900 whitespace-no-wrap">
                                                    {user.createdAt}
                                                </p>
                                            </td>
                                            <td className="px-5 py-2 border border-gray-200 bg-white text-sm">
                                                <span
                                                    className={`relative inline-block px-3 py-1 font-semibold leading-tight ${statusColorMap[user.status]}`}
                                                >
                                                    <span
                                                        aria-hidden
                                                        className={`absolute inset-0 opacity-50 rounded-full ${statusColorMap[user.status].split(" ")[1]}`}
                                                    ></span>
                                                    <span className="relative">{user.status}</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-5 py-2 bg-white border flex flex-col xs:flex-row items-center xs:justify-between">
                                <div className="inline-flex mt-2 xs:mt-0 gap-2">
                                    <Button
                                        onClick={handlePrev}
                                        disabled={currentPage === 1}
                                        className={`text-sm font-semibold py-2 px-4 rounded-md ${
                                            currentPage === 1
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                                        }`}
                                    >
                                        Prev
                                    </Button>
                                    <span className="text-xs xs:text-sm text-gray-900 flex items-center">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        onClick={handleNext}
                                        disabled={currentPage === totalPages}
                                        className={`text-sm font-semibold py-2 px-4 rounded-md ${
                                            currentPage === totalPages
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                                        }`}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TokenStatus;
