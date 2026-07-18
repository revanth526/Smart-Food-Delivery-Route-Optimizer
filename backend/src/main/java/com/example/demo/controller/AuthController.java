package com.example.demo.controller;

import com.example.demo.model.UserOtp;
import com.example.demo.repository.UserOtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserOtpRepository userOtpRepository;

    @PostMapping("/otp")
    @Transactional
    public ResponseEntity<?> sendOtp(@RequestParam String phone) {
        // Generate random 4-digit PIN
        String otp = String.format("%04d", 1000 + new Random().nextInt(9000));
        
        // Remove previous OTPs for this number to avoid duplication
        userOtpRepository.deleteByPhone(phone);
        
        // Save the new OTP code to the database
        userOtpRepository.save(new UserOtp(phone, otp));

        // Print directly to console for backup
        System.out.println("\n==================================================");
        System.out.println("💾 [DATABASE SAVED] Secure OTP Generated for: " + phone);
        System.out.println("👉 OTP CODE IS: " + otp);
        System.out.println("==================================================");

        return ResponseEntity.ok(Map.of("message", "OTP generated and saved to DB. Check the live database panel!"));
    }

    @PostMapping("/verify")
    @Transactional
    public ResponseEntity<?> verifyOtp(@RequestParam String phone, @RequestParam String otp) {
        return userOtpRepository.findTopByPhoneOrderByCreatedAtDesc(phone)
                .map(dbOtp -> {
                    if (dbOtp.getOtp().equals(otp)) {
                        userOtpRepository.deleteByPhone(phone); // Clear OTP after success
                        return ResponseEntity.ok(Map.of("success", true, "message", "OTP verified successfully."));
                    }
                    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid OTP."));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("success", false, "message", "No active OTP found for this phone number.")));
    }

    @GetMapping("/active-otps")
    public List<UserOtp> getActiveOtps() {
        // Expose database records directly for verification
        return userOtpRepository.findAllByOrderByCreatedAtDesc();
    }
}
