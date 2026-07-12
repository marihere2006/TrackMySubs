package com.trackmysubs.service;

import com.trackmysubs.entity.MerchantKnowledge;
import com.trackmysubs.repository.MerchantKnowledgeRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class MerchantNormalizerService {

    private final MerchantKnowledgeRepository repository;

    public MerchantNormalizerService(MerchantKnowledgeRepository repository) {
        this.repository = repository;
    }

    /**
     * Normalizes a raw bank transaction description into a normalized merchant name.
     * e.g. "POS DIR DR NETFLIX COM" -> "netflix"
     */
    public String normalize(String rawDescription) {
        if (rawDescription == null) return "unknown";
        
        String clean = rawDescription.toLowerCase()
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        
        // Check common substrings to normalize to known keys
        if (clean.contains("netflix")) return "netflix";
        if (clean.contains("spotify")) return "spotify";
        if (clean.contains("amazon") || clean.contains("prime")) return "amazon_prime";
        if (clean.contains("youtube") || clean.contains("yt premium")) return "youtube_premium";
        if (clean.contains("hotstar") || clean.contains("disney")) return "hotstar";
        if (clean.contains("zee5")) return "zee5";
        if (clean.contains("sonyliv")) return "sonyliv";
        if (clean.contains("apple") && clean.contains("music")) return "apple_music";
        if (clean.contains("google") && clean.contains("one")) return "google_one";
        if (clean.contains("microsoft") || clean.contains("msft")) return "microsoft_365";
        if (clean.contains("notion")) return "notion";
        if (clean.contains("chatgpt") || clean.contains("openai")) return "chatgpt";
        if (clean.contains("adobe")) return "adobe";
        if (clean.contains("canva")) return "canva";
        if (clean.contains("dropbox")) return "dropbox";
        if (clean.contains("icloud") || clean.contains("apple com bill")) return "icloud";
        if (clean.contains("jiocinema")) return "jio_cinema";
        if (clean.contains("github") || clean.contains("copilot")) return "github_copilot";
        if (clean.contains("xbox")) return "xbox_game_pass";
        
        // Fallback: replace spaces with underscores for the first 2 words
        String[] words = clean.split(" ");
        if (words.length >= 2) {
            return words[0] + "_" + words[1];
        }
        return clean.isEmpty() ? "unknown" : clean;
    }

    /**
     * Look up the merchant in the knowledge base.
     */
    public Optional<MerchantKnowledge> lookupMerchant(String normalizedName) {
        Optional<MerchantKnowledge> match = repository.findByNormalizedName(normalizedName);
        if (match.isPresent()) {
            repository.touchLastUsed(normalizedName, LocalDateTime.now());
        }
        return match;
    }
    
    /**
     * Add a new discovered merchant to the KB to save future AI calls.
     */
    public MerchantKnowledge learnMerchant(String normalizedName, String displayName, String category) {
        if (!repository.existsByNormalizedName(normalizedName)) {
            MerchantKnowledge kb = new MerchantKnowledge();
            kb.setNormalizedName(normalizedName);
            kb.setDisplayName(displayName);
            kb.setCategory(category);
            kb.setBillingCycle("Monthly");
            kb.setConfidence(85); // AI learned
            return repository.save(kb);
        }
        return repository.findByNormalizedName(normalizedName).orElse(null);
    }
}
