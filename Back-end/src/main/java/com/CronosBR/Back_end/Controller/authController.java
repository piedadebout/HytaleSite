package com.CronosBR.Back_end.Controller;

import com.CronosBR.Back_end.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.UUID;

@CrossOrigin(origins = "*")
@RequestMapping("/auth")
@RestController
public class authController {

    @GetMapping("/signIn")
    public void SignIn(String username, String password){

    }

    @PostMapping("/SignUp")
    public ResponseEntity<User> SignUp (@RequestBody User user){
        user.setId(UUID.randomUUID().toString());
        System.out.println(user);

        return ResponseEntity.ok(user);
    }





}
