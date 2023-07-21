import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import NFTActorClass "../NFT/nft";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Iter "mo:base/Iter";

actor OpenD {

    // Type definition for an NFT Listing
    private type Listing = {
        itemOwner : Principal;
        itemPrice : Nat;
    };

    // HashMap to store NFTs, mapping Principal IDs to NFT objects
    var mapOfNFTs = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);
    // HashMap to store ownership, mapping Principal IDs to a List of NFT Principal IDs they own
    var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);
    // HashMap to store NFT listings, mapping Principal IDs to Listing objects
    var mapOfListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);

    // Function to mint a new NFT and assign it to an owner
    public shared (msg) func mint(imgData : [Nat8], name : Text) : async Principal {
        let owner : Principal = msg.caller;

        // Print and add cycles to the canister (for demo purposes)
        Debug.print(debug_show (Cycles.balance()));
        Cycles.add(100_500_000_000);

        // Create a new NFT object
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);

        // Print and add cycles again (for demo purposes)
        Debug.print(debug_show (Cycles.balance()));

        // Get the Principal ID of the new NFT
        let newNFTPrincipal = await newNFT.getCanisterId();

        // Store the new NFT in the map of NFTs
        mapOfNFTs.put(newNFTPrincipal, newNFT);

        // Add the new NFT to the ownership map of the owner
        addToOwnershipMap(owner, newNFTPrincipal);

        return newNFTPrincipal;
    };

    // Private function to add an NFT Principal ID to the ownership map of a specific user
    private func addToOwnershipMap(owner : Principal, nftId : Principal) {
        var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(owner)) {
            case null List.nil<Principal>();
            case (?result) result;
        };

        ownedNFTs := List.push(nftId, ownedNFTs);
        mapOfOwners.put(owner, ownedNFTs);
    };

    // Query function to get the list of NFTs owned by a user
    public query func getOwnedNFTs(user : Principal) : async [Principal] {
        var userNFTs : List.List<Principal> = switch (mapOfOwners.get(user)) {
            case null List.nil<Principal>();
            case (?result) result;
        };

        return List.toArray(userNFTs);
    };

    // Query function to get the list of NFTs listed for sale
    public query func getListedNFTs() : async [Principal] {
        let ids = Iter.toArray(mapOfListings.keys());
        return ids;
    };

    // Shared function to list an NFT for sale with a specified price
    public shared (msg) func listItem(id : Principal, price : Nat) : async Text {
        var item : NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
            case null return "NFT does not exist.";
            case (?result) result;
        };

        let owner = await item.getOwner();
        if (Principal.equal(owner, msg.caller)) {
            let newListing : Listing = {
                itemOwner = owner;
                itemPrice = price;
            };
            mapOfListings.put(id, newListing);
            return "Success";
        } else {
            return "You don't own the NFT.";
        };
    };

    // Query function to get the Principal ID of the OpenD actor itself
    public query func getOpenDCanisterID() : async Principal {
        return Principal.fromActor(OpenD);
    };

    // Query function to check if an NFT is listed for sale
    public query func isListed(id : Principal) : async Bool {
        if (mapOfListings.get(id) == null) {
            return false;
        } else {
            return true;
        };
    };

    // Query function to get the original owner of a listed NFT
    public query func getOriginalOwner(id : Principal) : async Principal {
        var listing : Listing = switch (mapOfListings.get(id)) {
            case null return Principal.fromText("");
            case (?result) result;
        };

        return listing.itemOwner;
    };

    // Query function to get the price of a listed NFT
    public query func getListedNFTPrice(id : Principal) : async Nat {
        var listing : Listing = switch (mapOfListings.get(id)) {
            case null return 0;
            case (?result) result;
        };

        return listing.itemPrice;
    };

    // Shared function to complete the purchase of an NFT
    public shared (msg) func completePurchase(id : Principal, ownerId : Principal, newOwnerId : Principal) : async Text {
        var purchasedNFT : NFTActorClass.NFT = switch (mapOfNFTs.get(id)) {
            case null return "NFT does not exist";
            case (?result) result;
        };

        let transferResult = await purchasedNFT.transferOwnership(newOwnerId);
        if (transferResult == "Success") {
            // Delete the listing after successful purchase
            mapOfListings.delete(id);

            // Update the ownership maps for both the old and new owners
            var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(ownerId)) {
                case null List.nil<Principal>();
                case (?result) result;
            };
            ownedNFTs := List.filter(
                ownedNFTs,
                func(listItemId : Principal) : Bool {
                    return listItemId != id;
                },
            );

            addToOwnershipMap(newOwnerId, id);
            return "Success";
        } else {
            // Handle transfer failure
            Debug.print("hello");
            return transferResult;
        };
    };
};
