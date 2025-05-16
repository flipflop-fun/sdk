import { gql } from '@apollo/client';

export const queryInitializeTokenEventBySearch = gql`
query GetInitializedTokenEvents($skip: Int!, $first: Int!, $searchQuery: String!) {
    initializeTokenEventEntities(
        skip: $skip
        first: $first
        where: {
            and: [
                {
                    or: [
                        { tokenName_contains_nocase: $searchQuery },
                        { tokenSymbol_contains_nocase: $searchQuery },
                        { admin_contains_nocase: $searchQuery },
                        { mint_contains_nocase: $searchQuery }
                    ]
                },
                { status: 1 }
            ]
        }
        orderBy: difficultyCoefficientEpoch
        orderDirection: desc
    ) {
        id
        txId
        admin
        tokenId
        mint
        configAccount
        metadataAccount
        tokenVault
        timestamp
        tokenName
        tokenSymbol
        tokenUri
        supply
        currentEra
        currentEpoch
        elapsedSecondsEpoch
        startTimestampEpoch
        lastDifficultyCoefficientEpoch
        difficultyCoefficientEpoch
        mintSizeEpoch
        quantityMintedEpoch
        targetMintSizeEpoch
        totalMintFee
        totalReferrerFee
        totalTokens
        targetEras
        epochesPerEra
        targetSecondsPerEpoch
        reduceRatio
        initialMintSize
        initialTargetMintSizePerEpoch
        feeRate
        liquidityTokensRatio
        startTimestamp
        status
        metadataTimestamp
        valueManager
        wsolVault
        graduateEpoch
    }
}`;