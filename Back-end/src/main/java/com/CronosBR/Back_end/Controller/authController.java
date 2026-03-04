package com.CronosBR.Back_end.Controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/auth")
@RestController
public class authController {

    @GetMapping("/signIn")
    public void SignIn(String username, String password){

    }

    @PostMapping("/SignUp")
    public void SignUp (String user, String email, String password){
        System.out.println("Test");
    }



}
