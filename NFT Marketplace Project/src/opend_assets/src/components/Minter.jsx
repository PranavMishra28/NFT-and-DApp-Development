// Importing required modules from React and other packages
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { opend } from "../../../declarations/opend";
import { Principal } from "@dfinity/principal";
import Item from "./Item";

// Minter component definition
function Minter() {
    // Use react-hook-form to handle form submission and input validation
    const { register, handleSubmit } = useForm();
    // State variables to store NFT principal and loader status
    const [nftPrincipal, setNFTPrincipal] = useState("");
    const [loaderHidden, setLoaderHidden] = useState(true);

    // Function to handle form submission
    async function onSubmit(data) {
        // Show the loader while the NFT is being minted
        setLoaderHidden(false);

        // Extract the name and image data from the form
        const name = data.name;
        const image = data.image[0];
        const imageArray = await image.arrayBuffer();
        const imageByteData = [...new Uint8Array(imageArray)];

        // Mint a new NFT using the opend canister
        const newNFTID = await opend.mint(imageByteData, name);
        console.log(newNFTID.toText());

        // Update the state with the new NFT principal and hide the loader
        setNFTPrincipal(newNFTID);
        setLoaderHidden(true);
    }

    // Conditional rendering based on whether an NFT has been minted or not
    if (nftPrincipal === "") {
        // Render the form for minting an NFT
        return (
            <div className="minter-container">
                <div hidden={loaderHidden} className="lds-ellipsis">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <h3 className="makeStyles-title-99 Typography-h3 form-Typography-gutterBottom">
                    Create NFT
                </h3>
                <h6 className="form-Typography-root makeStyles-subhead-102 form-Typography-subtitle1 form-Typography-gutterBottom">
                    Upload Image
                </h6>
                <form className="makeStyles-form-109" noValidate="" autoComplete="off">
                    <div className="upload-container">
                        <input
                            {...register("image", { required: true })}
                            className="upload"
                            type="file"
                            accept="image/x-png,image/jpeg,image/gif,image/svg+xml,image/webp"
                        />
                    </div>
                    <h6 className="form-Typography-root makeStyles-subhead-102 form-Typography-subtitle1 form-Typography-gutterBottom">
                        Collection Name
                    </h6>
                    <div className="form-FormControl-root form-TextField-root form-FormControl-marginNormal form-FormControl-fullWidth">
                        <div className="form-InputBase-root form-OutlinedInput-root form-InputBase-fullWidth form-InputBase-formControl">
                            <input
                                {...register("name", { required: true })}
                                placeholder="e.g. CryptoDunks"
                                type="text"
                                className="form-InputBase-input form-OutlinedInput-input"
                            />
                            <fieldset className="PrivateNotchedOutline-root-60 form-OutlinedInput-notchedOutline"></fieldset>
                        </div>
                    </div>
                    <div className="form-ButtonBase-root form-Chip-root makeStyles-chipBlue-108 form-Chip-clickable">
                        <span onClick={handleSubmit(onSubmit)} className="form-Chip-label">
                            Mint NFT
                        </span>
                    </div>
                </form>
            </div>
        );
    } else {
        // Render the minted NFT
        return (
            <div className="minter-container">
                <h3 className="Typography-root makeStyles-title-99 Typography-h3 form-Typography-gutterBottom">
                    Minted!
                </h3>
                <div className="horizontal-center">
                    <Item id={nftPrincipal.toText()} />
                </div>
            </div>
        );
    }
}

// Export the Minter component as the default export
export default Minter;
