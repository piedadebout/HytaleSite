package com.CronosBR.Back_end.Controller;

import com.CronosBR.Back_end.model.User;
import com.CronosBR.Back_end.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/user")
@RestController
public class UserController {

    private UserRepository userRepository;



    public ResponseEntity<User> Getuser(String Id){


        return null;
    }
}
