package com.example.demo.repository;

import com.example.demo.model.UserOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserOtpRepository extends JpaRepository<UserOtp, Long> {
    Optional<UserOtp> findTopByPhoneOrderByCreatedAtDesc(String phone);
    List<UserOtp> findAllByOrderByCreatedAtDesc();
    void deleteByPhone(String phone);
}
