package com.CronosBR.Back_end.repository;

import com.CronosBR.Back_end.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface authRepository extends JpaRepository<User,String> {

}
