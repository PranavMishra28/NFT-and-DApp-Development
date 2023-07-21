// Importing required modules from React and other packages
import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdlFactory } from "../../../declarations/token";
import { Principal } from "@dfinity/principal";
import { opend } from "../../../declarations/opend";
import Button from "./Button";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

// Item component definition
function Item(props) {
    // State variables using React's 'useState' hook
    const [name, setName] = useState();
    const [owner, setOwner] = useState();
    const [image, setImage] = useState();
    const [button, setButton] = useState();
    const [priceInput, setPriceInput] = useState();
    const [loaderHidden, setLoaderHidden] = useState(true);
    const [blur, setBlur] = useState();
    const [sellStatus, setSellStatus] = useState("");
    const [priceLabel, setPriceLabel] = useState();
    const [shouldDisplay, setDisplay] = useState(true);

    // Destructuring 'props' to get the 'id' property
    const { id } = props;

    // Define the local host URL for the backend
    const localHost = "http://localhost:8080/";
    // Create an HTTP Agent using the specified host
    const agent = new HttpAgent({ host: localHost });

    //When deploy live, remove the following line.
    // Fetch the root key for the agent (temporary action, to be removed in production)
    agent.fetchRootKey();
    let NFTActor;

    // Function to load the NFT data from the backend
    async function loadNFT() {
        // Create an NFTActor using the provided 'idlFactory' and the agent
        NFTActor = await Actor.createActor(idlFactory, {
            agent,
            canisterId: id,
        });

        // Retrieve NFT data from the backend
        const name = await NFTActor.getName();
        const owner = await NFTActor.getOwner();
        const imageData = await NFTActor.getAsset();
        const imageContent = new Uint8Array(imageData);
        const image = URL.createObjectURL(
            new Blob([imageContent.buffer], { type: "image/png" })
        );

        // Update the state variables with the retrieved data
        setName(name);
        setOwner(owner.toText());
        setImage(image);

        // Conditionally update state variables based on the 'role' prop passed to the component
        if (props.role == "collection") {
            const nftIsListed = await opend.isListed(props.id);

            if (nftIsListed) {
                setOwner("OpenD");
                setBlur({ filter: "blur(4px)" });
                setSellStatus("Listed");
            } else {
                setButton(<Button handleClick={handleSell} text={"Sell"} />);
            }
        } else if (props.role == "discover") {
            const originalOwner = await opend.getOriginalOwner(props.id);
            if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
                setButton(<Button handleClick={handleBuy} text={"Buy"} />);
            }

            const price = await opend.getListedNFTPrice(props.id);
            setPriceLabel(<PriceLabel sellPrice={price.toString()} />);
        }
    }

    // Use the 'useEffect' hook to load the NFT data when the component mounts
    useEffect(() => {
        loadNFT();
    }, []);

    // Define a 'price' variable and a function to handle selling an item
    let price;
    function handleSell() {
        console.log("Sell clicked");
        setPriceInput(
            <input
                placeholder="Price in DANG"
                type="number"
                className="price-input"
                value={price}
                onChange={(e) => (price = e.target.value)}
            />
        );
        setButton(<Button handleClick={sellItem} text={"Confirm"} />);
    }

    // Function to handle selling an item
    async function sellItem() {
        setBlur({ filter: "blur(4px)" });
        setLoaderHidden(false);
        console.log("set price = " + price);
        const listingResult = await opend.listItem(props.id, Number(price));
        console.log("listing: " + listingResult);
        if (listingResult == "Success") {
            const openDId = await opend.getOpenDCanisterID();
            const transferResult = await NFTActor.transferOwnership(openDId);
            console.log("transfer: " + transferResult);
            if (transferResult == "Success") {
                setLoaderHidden(true);
                setButton();
                setPriceInput();
                setOwner("OpenD");
                setSellStatus("Listed");
            }
        }
    }

    // Function to handle the buy action
    async function handleBuy() {
        console.log("Buy was triggered");
        setLoaderHidden(false);
        const tokenActor = await Actor.createActor(tokenIdlFactory, {
            agent,
            canisterId: Principal.fromText("<REPLACE WITH YOUR TOKEN CANISTER ID>"),
        });

        const sellerId = await opend.getOriginalOwner(props.id);
        const itemPrice = await opend.getListedNFTPrice(props.id);

        const result = await tokenActor.transfer(sellerId, itemPrice);
        if (result == "Success") {
            const transferResult = await opend.completePurchase(
                props.id,
                sellerId,
                CURRENT_USER_ID
            );
            console.log("purchase: " + transferResult);
            setLoaderHidden(true);
            setDisplay(false);
        }
    }

    // JSX template for the Item component
    return (
        <div
            style={{ display: shouldDisplay ? "inline" : "none" }}
            className="disGrid-item"
        >
            <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
                <img
                    className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
                    src={image}
                    style={blur}
                />
                <div className="lds-ellipsis" hidden={loaderHidden}>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div className="disCardContent-root">
                    {priceLabel}
                    <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
                        {name}
                        <span className="purple-text"> {sellStatus}</span>
                    </h2>
                    <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
                        Owner: {owner}
                    </p>
                    {priceInput}
                    {button}
                </div>
            </div>
        </div>
    );
}

// Export the Item component as the default export
export default Item;
