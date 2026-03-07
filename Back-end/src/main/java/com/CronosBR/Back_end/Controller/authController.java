package com.CronosBR.Back_end.Controller;

import com.CronosBR.Back_end.model.User;
import com.CronosBR.Back_end.repository.UserRepository;
import com.CronosBR.Back_end.repository.authRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.UUID;

@RequestMapping("/auth")
@RestController
public class authController {

    private UserRepository userRepository;

    public authController(UserRepository userRepository, authRepository authRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/signIn")
    public ResponseEntity<User> SignIn(@RequestBody User user){
        System.out.println(user);

        return ResponseEntity.ok(user);
    }

    @PostMapping("/SignUp")
    public ResponseEntity<User> SignUp (@RequestBody User user){
        user.setId(UUID.randomUUID().toString());
        System.out.println(user);
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }





}
