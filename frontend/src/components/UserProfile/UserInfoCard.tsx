import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axios from "axios";

interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  bio: string;
  image: File | null;
}

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: 1,
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bio: "",
    image: null,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserInfo(parsedUser);
    }
  }, []);

  const handleChange = (field: keyof UserInfo, value: any) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("id", String(userInfo.id));
      formData.append("firstName", userInfo.firstName);
      formData.append("lastName", userInfo.lastName);
      formData.append("email", userInfo.email);
      formData.append("phoneNumber", userInfo.phoneNumber);
      formData.append("bio", userInfo.bio);
      if (userInfo.image) {
        formData.append("image", userInfo.image);
      }

      const response = await axios.put(`${apiUrl}/auth/profile/update`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = response.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUserInfo(updatedUser);
      closeModal();
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Profile update failed", error);
      alert("Failed to update profile");
    }
  };

  return (
<div className="col-span-full w-full">
  <div className="w-full p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      {/* Left: Title + Fields */}
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Personal Information
        </h4>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-10">
          <div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400"> Name</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
              {userInfo.firstName}  {userInfo.lastName}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Last Name</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
              {userInfo.lastName}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
              {userInfo.email}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Phone</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
              {userInfo.phoneNumber}
            </p>
          </div>
          
        </div>
      </div>

      {/* Right: Edit button */}
      <button
        onClick={openModal}
        className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
      >
        <svg
          className="fill-current"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
          />
        </svg>
        Edit
      </button>
    </div>

    {/* Modal unchanged except: optional full width tweaks below */}
    <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
      <div className="w-full max-w-[700px] rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <form className="flex flex-col">
          <div className="h-[450px] overflow-y-auto px-2 pb-3">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="col-span-2 flex justify-center">
                {/* ... image uploader unchanged ... */}
              </div>

              <div>
                <Label>First Name</Label>
                <Input type="text" value={userInfo.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input type="text" value={userInfo.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={userInfo.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="text" value={userInfo.phoneNumber} onChange={(e) => handleChange("phoneNumber", e.target.value)} />
              </div>
              {/* <div className="lg:col-span-2">
                <Label>Bio</Label>
                <Input type="text" value={userInfo.bio} onChange={(e) => handleChange("bio", e.target.value)} />
              </div> */}
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeModal}>
              Close
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  </div>
</div>

  );
}
